'use client';

import React, { useState } from 'react';

const ClientCard = ({ client, onSave, onDelete }) => {
  const [editableClient, setEditableClient] = useState(client);

  const handleInputChange = (field, value) => {
    setEditableClient({ ...editableClient, [field]: value });
  };

  return (
    <div className="border p-4 rounded shadow">
      <h3 className="text-lg font-bold mb-2">{editableClient.eesnimi} {editableClient.perenimi}</h3>
      <div className="mb-2">
        <label className="block">First Name:</label>
        <input
          type="text"
          value={editableClient.eesnimi}
          onChange={(e) => handleInputChange('eesnimi', e.target.value)}
          className="border p-2 w-full"
        />
      </div>
      <div className="mb-2">
        <label className="block">Last Name:</label>
        <input
          type="text"
          value={editableClient.perenimi}
          onChange={(e) => handleInputChange('perenimi', e.target.value)}
          className="border p-2 w-full"
        />
      </div>
      <div className="mb-2">
        <label className="block">ID Code:</label>
        <input
          type="text"
          value={editableClient.isikukood}
          onChange={(e) => handleInputChange('isikukood', e.target.value)}
          className="border p-2 w-full"
        />
      </div>
      <div className="flex justify-between">
        <button onClick={() => onSave(editableClient)} className="bg-green-500 text-white px-4 py-2 rounded">
          Save
        </button>
        <button onClick={() => onDelete(editableClient.id)} className="bg-red-500 text-white px-4 py-2 rounded">
          Delete
        </button>
      </div>
    </div>
  );
};

export default ClientCard;
