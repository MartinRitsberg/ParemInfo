'use client';
import { useState } from 'react';

const EventsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([
    { id: 1, name: 'Sündmus 1', time: '10:30', info: 'Info' },
    { id: 2, name: 'Sündmus 2', time: '12:00', info: 'Info' },
  ]);

  const handleEditClick = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const handleSaveChanges = () => {
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === selectedEvent.id ? selectedEvent : event
      )
    );
    handleCloseModal();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedEvent((prevEvent) => ({
      ...prevEvent,
      [name]: value,
    }));
  };

  return (
    <div className="events-page">
      <div className="event-details">
        <h2>Sündmused</h2>
        {events.map((event) => (
          <div className="event-row" key={event.id}>
            <div className="event-name">{event.name}</div>
            <div className="event-time">{event.time}</div>
            <div className="event-info">{event.info}</div>
            <button className="event-edit" onClick={() => handleEditClick(event)}>
              Muuda
            </button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Muuda sündmust</h3>
            <form>
              <label>
                Nimi:
                <input
                  type="text"
                  name="name"
                  value={selectedEvent?.name || ''}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Aeg:
                <input
                  type="text"
                  name="time"
                  value={selectedEvent?.time || ''}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Info:
                <input
                  type="text"
                  name="info"
                  value={selectedEvent?.info || ''}
                  onChange={handleInputChange}
                />
              </label>
            </form>
            <button onClick={handleSaveChanges}>Salvesta</button>
            <button onClick={handleCloseModal}>Sulge</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;