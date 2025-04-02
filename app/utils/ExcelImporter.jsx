import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

const ExcelImporter = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [sheetNames, setSheetNames] = useState([]);
  const [sheetData, setSheetData] = useState({});
  const [dbReady, setDbReady] = useState(false);
  const [activeSheet, setActiveSheet] = useState(null);
  
  // Database configuration
  const DB_NAME = 'ExcelDataDB';
  const STORE_NAME = 'excelData';
  const DB_VERSION = 1;
  
  // Initialize the database when component mounts
  useEffect(() => {
    // First, check if database exists and delete it if needed for a clean start
    const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
    
    deleteRequest.onsuccess = () => {
      console.log(`Database ${DB_NAME} successfully deleted. Creating new database...`);
      initializeDatabase();
    };
    
    deleteRequest.onerror = (event) => {
      console.error(`Error deleting database: ${event.target.error}`);
      // Try initializing anyway
      initializeDatabase();
    };
    
    function initializeDatabase() {
      const dbRequest = indexedDB.open(DB_NAME, DB_VERSION);
      
      dbRequest.onerror = (event) => {
        const errorMsg = `Database error: ${event.target.error}`;
        setError(errorMsg);
        console.error(errorMsg);
      };
      
      dbRequest.onupgradeneeded = (event) => {
        console.log("Database upgrade needed - creating object store");
        const db = event.target.result;
        
        // Create object store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          console.log(`Object store "${STORE_NAME}" created`);
        }
      };
      
      dbRequest.onsuccess = (event) => {
        const db = event.target.result;
        console.log(`Database initialized successfully. Object stores: ${[...db.objectStoreNames].join(', ')}`);
        
        // Verify object store exists
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          setError(`Object store "${STORE_NAME}" does not exist in the database.`);
          console.error(`Object store "${STORE_NAME}" does not exist in the database.`);
          db.close();
          return;
        }
        
        setDbReady(true);
        db.close();
      };
    }
    
    return () => {
      // Cleanup function
      console.log("Component unmounting, database connections should be closed");
    };
  }, []);
  
  // Handle file selection
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);
      setActiveSheet(null);
      
      // Read all sheets from Excel file
      const sheetsData = await readAllSheetsFromExcel(file);
      
      // Store all sheets in IndexedDB
      await storeAllSheetsInIndexedDB(sheetsData);
      
      // Update sheet names for display
      const names = Object.keys(sheetsData);
      setSheetNames(names);
      setSheetData(sheetsData);
      
      // Set first sheet as active by default
      if (names.length > 0) {
        setActiveSheet(names[0]);
      }
      
      setSuccess(true);
      console.log('All Excel sheets successfully imported to IndexedDB');
    } catch (err) {
      setError(err.message);
      console.error('Error importing Excel data:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Read all sheets from Excel file
  const readAllSheetsFromExcel = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Object to store all sheets
          const allSheets = {};
          
          // Process each sheet in the workbook
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to JSON with headers
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // Filter out empty rows or cells
            const filteredData = jsonData.filter(row => 
              row.some(cell => cell !== undefined && cell !== null && cell !== '')
            );
            
            // Skip empty sheets after filtering
            if (filteredData.length === 0) {
              console.log(`Skipping empty sheet: ${sheetName}`);
              return;
            }
            
            // Extract headers and data
            const headers = filteredData[0];
            const records = filteredData.slice(1).map(row => {
              const record = {};
              headers.forEach((header, index) => {
                // Handle empty header names
                const headerName = header || `Column${index}`;
                record[headerName] = row[index];
              });
              return record;
            });
            
            // Ensure we're storing as an array
            allSheets[sheetName] = Array.isArray(records) ? records : [records];
          });
          
          resolve(allSheets);
        } catch (err) {
          reject(new Error('Failed to parse Excel file: ' + err.message));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read the file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  };
  
  // Store all sheets in IndexedDB
  const storeAllSheetsInIndexedDB = (sheetsData) => {
    return new Promise((resolve, reject) => {
      if (!dbReady) {
        reject(new Error('Database is not ready yet. Please try again.'));
        return;
      }
      
      console.log(`Opening database ${DB_NAME} with object store ${STORE_NAME}`);
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = (event) => {
        const errorMsg = `IndexedDB error: ${event.target.error}`;
        console.error(errorMsg);
        reject(new Error(errorMsg));
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        console.log(`Database opened successfully. Available stores: ${[...db.objectStoreNames].join(', ')}`);
        
        // Check if the object store exists
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const errorMsg = `Object store "${STORE_NAME}" not found. Database might need to be reset.`;
          db.close();
          console.error(errorMsg);
          reject(new Error(errorMsg));
          return;
        }
        
        try {
          const transaction = db.transaction(STORE_NAME, 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          
          console.log(`Transaction created successfully for store: ${STORE_NAME}`);
          
          // Clear any existing data
          store.clear();
          
          // Store client data separately
          if (sheetsData['Clients']) {
            const clientData = sheetsData['Clients'];
            clientData.forEach((client, index) => {
              try {
                store.add({
                  id: `client_${index + 1}`,
                  type: 'client',
                  data: client,
                });
              } catch (err) {
                console.error('Error storing client data:', err);
              }
            });
          }
          
          // Store other sheets
          Object.entries(sheetsData).forEach(([sheetName, data]) => {
            if (sheetName !== 'Clients') {
              try {
                store.add({
                  id: `sheet_${sheetName}`,
                  sheetName: sheetName,
                  data: data,
                  timestamp: new Date().toISOString(),
                });
              } catch (err) {
                console.error(`Error storing sheet ${sheetName}:`, err);
              }
            }
          });
          
          transaction.oncomplete = () => {
            console.log('Transaction completed successfully');
            db.close();
            resolve();
          };
          
          transaction.onerror = (event) => {
            const errorMsg = `Transaction error: ${event.target.error}`;
            console.error(errorMsg);
            reject(new Error(errorMsg));
          };
        } catch (err) {
          db.close();
          console.error('Failed to create transaction:', err);
          reject(new Error(`Failed to create transaction: ${err.message}`));
        }
      };
    });
  };

  // Render each sheet data
  const renderSheetData = (name) => {
    if (!sheetData[name] || !sheetData[name].length) return null;

    return (
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="bg-indigo-600 text-white">
              {Object.keys(sheetData[name][0] || {}).map((key, index) => (
                <th key={index} className="py-3 px-4 text-left font-semibold">{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sheetData[name].map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className={`
                  border-b border-gray-200 hover:bg-gray-100 transition-colors
                  ${rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                `}
              >
                {Object.values(row).map((cell, cellIndex) => (
                  <td key={cellIndex} className="py-2 px-4">
                    {cell !== undefined && cell !== null ? cell.toString() : ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-indigo-700 p-6 text-white">
          <h2 className="text-2xl font-bold">Excel Multi-Sheet Importer</h2>
          <p className="text-indigo-200 mt-1">Import and view your Excel data with ease</p>
        </div>
        
        <div className="p-6">
          <div className="mb-6 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
            <label className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="font-medium text-gray-700">Select Excel File:</span>
              <div className="relative">
                <input 
                  type="file" 
                  accept=".xlsx,.xls" 
                  onChange={handleFileUpload} 
                  disabled={!dbReady || isLoading}
                  className="hidden" 
                  id="file-upload"
                />
                <label 
                  htmlFor="file-upload" 
                  className={`
                    inline-flex items-center px-4 py-2 rounded-md text-sm font-medium
                    ${!dbReady || isLoading 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'}
                    transition-colors duration-200
                  `}
                >
                  {isLoading ? 'Uploading...' : 'Choose File'}
                </label>
              </div>
            </label>
            {!dbReady && (
              <p className="mt-2 text-amber-600 text-sm flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Initializing database, please wait...
              </p>
            )}
          </div>
          
          {isLoading && (
            <div className="flex justify-center items-center p-8">
              <div className="loader"></div>
              <span className="ml-3 text-indigo-600">Importing data...</span>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {success && (
            <div className="space-y-6">
              <div className="bg-green-50 border-l-4 border-green-500 p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      Data imported successfully! {sheetNames.length} sheets found.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Sheet tabs */}
              {sheetNames.length > 0 && (
                <div>
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-2 overflow-x-auto">
                      {sheetNames.map((name) => (
                        <button
                          key={name}
                          onClick={() => setActiveSheet(name)}
                          className={`
                            whitespace-nowrap py-2 px-4 text-sm font-medium rounded-t-md
                            ${activeSheet === name
                              ? 'bg-indigo-600 text-white'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}
                          `}
                        >
                          {name}
                        </button>
                      ))}
                    </nav>
                  </div>
                  
                  {/* Active sheet data */}
                  <div className="mt-4">
                    {activeSheet && renderSheetData(activeSheet)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* CSS for loader */}
      <style jsx>{`
        .loader {
          border: 3px solid #f3f3f3;
          border-radius: 50%;
          border-top: 3px solid #6366F1;
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ExcelImporter;