import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const ExcelExporter = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [fileName, setFileName] = useState('exported_data.xlsx');
  
  // Database configuration
  const DB_NAME = 'ExcelDataDB';
  const STORE_NAME = 'excelData';
  const DB_VERSION = 1;
  
  // Read data from IndexedDB
  const readFromDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = (event) => {
        reject(new Error('IndexedDB error: ' + event.target.errorCode));
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        
        // Get the data record
        const getRequest = store.get('excelData');
        
        getRequest.onsuccess = () => {
          if (getRequest.result && Array.isArray(getRequest.result.data)) {
            resolve(getRequest.result.data);
          } else {
            resolve([]);
          }
        };
        
        getRequest.onerror = (event) => {
          reject(new Error('Error reading data: ' + event.target.errorCode));
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      };
    });
  };
  
  // Export data to Excel
  const handleExport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);
      
      // Read data from IndexedDB
      const dataArray = await readFromDB();
      
      if (dataArray.length === 0) {
        setError('No data available to export');
        setIsLoading(false);
        return;
      }
      
      // Export to Excel
      exportToExcel(dataArray);
      
      setSuccess(true);
      console.log('Data exported to Excel successfully');
    } catch (err) {
      setError(err.message);
      console.error('Error exporting data:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Export data to Excel file
  const exportToExcel = (dataArray) => {
    try {
      // Get headers from first object
      const headers = Object.keys(dataArray[0]);
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      
      // Format data for Excel
      const excelData = [
        headers, // Header row
        ...dataArray.map(row => headers.map(header => row[header])) // Data rows
      ];
      
      const worksheet = XLSX.utils.aoa_to_sheet(excelData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      
      // Generate Excel file and trigger download
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      throw new Error('Failed to export to Excel: ' + error.message);
    }
  };
  
  // Handle file name change
  const handleFileNameChange = (e) => {
    let newFileName = e.target.value;
    
    // Add .xlsx extension if not present
    if (!newFileName.endsWith('.xlsx')) {
      newFileName += '.xlsx';
    }
    
    setFileName(newFileName);
  };
  
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Excel Exporter</h2>
      
      <div className="mb-6">
        <div className="mb-4">
          <label className="block mb-2">
            <span className="mr-2">File Name:</span>
            <input 
              type="text" 
              value={fileName}
              onChange={handleFileNameChange}
              className="border p-2 w-64"
              placeholder="exported_data.xlsx"
            />
          </label>
        </div>
        
        <button 
          onClick={handleExport}
          className="bg-purple-500 text-white px-4 py-2 rounded"
          disabled={isLoading}
        >
          Export to Excel
        </button>
      </div>
      
      {isLoading && <p className="text-blue-500">Exporting data...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {success && <p className="text-green-500">Data exported successfully!</p>}
    </div>
  );
};

export default ExcelExporter;