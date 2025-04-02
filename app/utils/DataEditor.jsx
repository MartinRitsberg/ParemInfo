import React, { useState, useEffect } from 'react';

const DataEditor = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Database configuration
  const DB_NAME = 'ExcelDataDB';
  const STORE_NAME = 'excelData';
  const DB_VERSION = 1;

  // Read from IndexedDB
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

  // Save data to IndexedDB
  const updateInDB = (dataArray) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        reject(new Error('IndexedDB error: ' + event.target.errorCode));
      };

      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        // Update the data record
        const updateRequest = store.put({
          id: 'excelData',
          data: dataArray,
          timestamp: new Date().toISOString(),
        });

        updateRequest.onsuccess = () => {
          resolve();
        };

        updateRequest.onerror = (event) => {
          reject(new Error('Error updating data: ' + event.target.errorCode));
        };

        transaction.oncomplete = () => {
          db.close();
        };
      };
    });
  };

  // Handle importing CSV data
  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvData = event.target.result;
      const parsedData = parseCSV(csvData);
      setData(parsedData);
      saveToDB(parsedData);
    };
    reader.readAsText(file);
  };

  // Parse CSV data into an array of objects
  const parseCSV = (csvData) => {
    const lines = csvData.split('\n');
    const headers = lines[0].split(','); // Assuming CSV headers
    const rows = lines.slice(1);

    return rows.map((row) => {
      const values = row.split(',');
      const obj = {};
      headers.forEach((header, index) => {
        obj[header.trim()] = values[index]?.trim() || '';
      });
      return obj;
    });
  };

  // Save data to IndexedDB after importing
  const saveToDB = async (importedData) => {
    try {
      setIsLoading(true);
      await updateInDB(importedData);
      setSuccess(true);
      console.log('Data saved to IndexedDB');
    } catch (err) {
      setError(err.message);
      console.error('Error saving data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Update data when editing a cell
  const handleCellEdit = (rowIndex, columnName, value) => {
    const updatedData = [...data];
    updatedData[rowIndex][columnName] = value;
    setData(updatedData);
  };

  // Save updated data to IndexedDB
  const saveEditedData = async () => {
    try {
      setIsLoading(true);
      await updateInDB(data);
      setSuccess(true);
      console.log('Edited data saved to IndexedDB');
    } catch (err) {
      setError(err.message);
      console.error('Error saving edited data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load the data from IndexedDB when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const dbData = await readFromDB();
        setData(dbData);
        setSuccess(false);
      } catch (err) {
        setError(err.message);
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div>
      <h2>Data Editor</h2>

      <input
        type="file"
        accept=".csv"
        onChange={handleImportData}
        disabled={isLoading}
      />
      {isLoading && <p>Loading...</p>}
      {error && <p className="error">Error: {error}</p>}
      {success && <p className="success">Data saved successfully!</p>}

      {data.length > 0 && (
        <div>
          <table>
            <thead>
              <tr>
                {Object.keys(data[0]).map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {Object.keys(row).map((header) => (
                    <td key={`${rowIndex}-${header}`}>
                      <input
                        type="text"
                        value={row[header]}
                        onChange={(e) =>
                          handleCellEdit(rowIndex, header, e.target.value)
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={saveEditedData} disabled={isLoading}>
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
};

export default DataEditor;
