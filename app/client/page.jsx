'use client';
import { useState } from 'react';
import { useAppContext } from "../context/AppContext";

const ClientPage = () => {
  const { app } = useAppContext();
  const activeClient = app.clientList.find((client) => client.id === app.activeClient);

  const [guardianInfo, setGuardianInfo] = useState({
    name: 'Eestkostja nimi',
    phone: '+37212345678',
  });

  const [isGuardianModalOpen, setIsGuardianModalOpen] = useState(false);

  const [activities, setActivities] = useState([
    { id: 1, clientId: 1, action: 'Tegevus 1', time: '10:30', info: 'Info 1' },
    { id: 2, clientId: 1, action: 'Tegevus 2', time: '12:00', info: 'Info 2' },
    { id: 3, clientId: 2, action: 'Tegevus 3', time: '14:00', info: 'Info 3' },
    { id: 4, clientId: 3, action: 'Tegevus 4', time: '16:00', info: 'Info 4' },
  ]);

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const clientActivities = activities.filter(
    (activity) => activity.clientId === activeClient?.id
  );

  const handleOpenGuardianModal = () => {
    setIsGuardianModalOpen(true);
  };

  const handleCloseGuardianModal = () => {
    setIsGuardianModalOpen(false);
  };

  const handleGuardianInputChange = (e) => {
    const { name, value } = e.target;
    setGuardianInfo((prevInfo) => ({
      ...prevInfo,
      [name]: value,
    }));
  };

  const handleSaveGuardianInfo = () => {
    console.log('Salvestatud eestkostja info:', guardianInfo);
    handleCloseGuardianModal();
  };

  const handleAddActivity = () => {
    setSelectedActivity({ id: null, clientId: activeClient.id, action: '', time: '', info: '' });
    setIsActivityModalOpen(true);
  };

  const handleEditActivity = (activity) => {
    setSelectedActivity(activity);
    setIsActivityModalOpen(true);
  };

  const handleCloseActivityModal = () => {
    setIsActivityModalOpen(false);
    setSelectedActivity(null);
  };

  const handleSaveActivity = () => {
    if (selectedActivity.id) {
      setActivities((prevActivities) =>
        prevActivities.map((activity) =>
          activity.id === selectedActivity.id ? selectedActivity : activity
        )
      );
    } else {
      setActivities((prevActivities) => [
        ...prevActivities,
        { ...selectedActivity, id: Date.now() },
      ]);
    }
    handleCloseActivityModal();
  };

  const handleActivityInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedActivity((prevActivity) => ({
      ...prevActivity,
      [name]: value,
    }));
  };

  return (
    <div className="client-page">
      {activeClient ? (
        <>
          <div className="client-info">
            <div className="client-photo">
              {activeClient.pilt ? (
                <img src={activeClient.pilt} alt="Kliendi pilt" />
              ) : (
                <div className="placeholder-photo">Foto puudub</div>
              )}
            </div>
            <div className="client-details">
              <h2>{activeClient.eesnimi} {activeClient.perenimi}</h2>
              <p>ID: {activeClient.isikukood}</p>
              <p>Kontaktinfo:</p>
              <p>Telefon: {activeClient.telefon || "Puudub"}</p>
              <p>Email: {activeClient.email || "Puudub"}</p>
            </div>
          </div>
          <div className="guardian-info">
            <h3>Eestkostja</h3>
            <p>Nimi: {guardianInfo.name}</p>
            <p>Telefon: {guardianInfo.phone}</p>
            <button className="info-button" onClick={handleOpenGuardianModal}>Lisa Info</button>
          </div>
          <div className="client-actions">
            <h3>Tegevused</h3>
            <button className="add-button" onClick={handleAddActivity}>Lisa</button>
            {clientActivities.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Tegevus</th>
                    <th>Aeg</th>
                    <th>Info</th>
                    <th>Muuda</th>
                  </tr>
                </thead>
                <tbody>
                  {clientActivities.map((activity) => (
                    <tr key={activity.id}>
                      <td>{activity.action}</td>
                      <td>{activity.time}</td>
                      <td>{activity.info}</td>
                      <td>
                        <button className="edit-button" onClick={() => handleEditActivity(activity)}>
                          Muuda
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Tegevusi ei leitud.</p>
            )}
          </div>
        </>
      ) : (
        <p>Vali klient külgribalt</p>
      )}

      {isGuardianModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Muuda eestkostja infot</h3>
            <form>
              <label>
                Nimi:
                <input
                  type="text"
                  name="name"
                  value={guardianInfo.name}
                  onChange={handleGuardianInputChange}
                />
              </label>
              <label>
                Telefon:
                <input
                  type="text"
                  name="phone"
                  value={guardianInfo.phone}
                  onChange={handleGuardianInputChange}
                />
              </label>
            </form>
            <button onClick={handleSaveGuardianInfo}>Salvesta</button>
            <button onClick={handleCloseGuardianModal}>Sulge</button>
          </div>
        </div>
      )}

      {isActivityModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>{selectedActivity?.id ? 'Muuda tegevust' : 'Lisa tegevus'}</h3>
            <form>
              <label>
                Tegevus:
                <input
                  type="text"
                  name="action"
                  value={selectedActivity?.action || ''}
                  onChange={handleActivityInputChange}
                />
              </label>
              <label>
                Aeg:
                <input
                  type="text"
                  name="time"
                  value={selectedActivity?.time || ''}
                  onChange={handleActivityInputChange}
                />
              </label>
              <label>
                Info:
                <input
                  type="text"
                  name="info"
                  value={selectedActivity?.info || ''}
                  onChange={handleActivityInputChange}
                />
              </label>
            </form>
            <button onClick={handleSaveActivity}>Salvesta</button>
            <button onClick={handleCloseActivityModal}>Sulge</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientPage;