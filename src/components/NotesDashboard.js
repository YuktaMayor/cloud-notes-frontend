import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotesDashboard.css';

export default function NotesDashboard() {
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [summaryMap, setSummaryMap] = useState({});
  const navigate = useNavigate();

  const titleRef = useRef();
  const contentRef = useRef();
  const tagsRef = useRef();
  const fileRef = useRef();

  // ✅ Use environment variable for backend URL
  const API_URL = process.env.REACT_APP_API_URL;

  // ✅ Fetch notes
  const fetchNotes = useCallback(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/notes`, {
      headers: { Authorization: token },
    })
      .then(res => res.json())
      .then(data => setNotes(data))
      .catch(() => navigate('/'));
  }, [navigate, API_URL]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/');
    fetchNotes();
  }, [navigate, fetchNotes]);

  // ✅ Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  // ✅ Add or edit note
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('title', titleRef.current.value);
    formData.append('content', contentRef.current.value);
    formData.append('tags', tagsRef.current.value);
    if (fileRef.current.files[0]) {
      formData.append('file', fileRef.current.files[0]);
    }

    const url = editingNoteId
      ? `${API_URL}/notes/${editingNoteId}`
      : `${API_URL}/notes`;

    const method = editingNoteId ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { Authorization: token },
      body: formData,
    });

    setEditingNoteId(null);
    e.target.reset();
    fetchNotes();
  };

  // ✅ Search notes
  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/search?q=${query}`, {
      headers: { Authorization: token },
    });

    const data = await res.json();
    setNotes(data);
  };

  // ✅ Delete note
  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/notes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: token },
    });
    fetchNotes();
  };

  // ✅ Summarize note
  const handleSummarize = async (note) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify({ content: note.content }),
    });
    const data = await res.json();
    setSummaryMap(prev => ({ ...prev, [note._id]: data.summary }));
  };

  // ✅ Toggle dark mode
  const toggleDarkMode = () => {
    document.body.classList.toggle('dark-mode');
  };

  // ✅ Filter by tag
  const filteredNotes = notes.filter(note =>
    selectedTag ? note.tags?.includes(selectedTag) : true
  );

  return (
    <div className="dashboard">
      <header>
        <h1>📝 My Notes</h1>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={handleSearch}
          />
          <select onChange={(e) => setSelectedTag(e.target.value)}>
            <option value="">All Tags</option>
            {[...new Set(notes.flatMap(n => n.tags?.split(',')))]
              .filter(Boolean)
              .map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
          </select>
          <button onClick={toggleDarkMode}>Toggle Dark Mode</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* ✅ Note form */}
      <form onSubmit={handleSubmit} className="note-form">
        <input ref={titleRef} placeholder="Title" required />
        <textarea ref={contentRef} placeholder="Content" required />
        <input ref={tagsRef} placeholder="Tags (comma-separated)" />
        <input type="file" ref={fileRef} />
        <button type="submit">{editingNoteId ? 'Update Note' : 'Add Note'}</button>
      </form>

      {/* ✅ Notes grid */}
      <div className="notes-grid">
        {filteredNotes.map(note => (
          <div key={note._id} className="note-card">
            <h3>{note.title}</h3>
            <p>{note.content}</p>
            {note.tags && <small>Tags: {note.tags}</small>}
            {note.fileUrl && (
              <a href={`${API_URL}${note.fileUrl}`} target="_blank" rel="noreferrer">
                📎 View Attachment
              </a>
            )}
            <div className="note-actions">
              <button onClick={() => {
                titleRef.current.value = note.title;
                contentRef.current.value = note.content;
                tagsRef.current.value = note.tags;
                setEditingNoteId(note._id);
              }}>Edit</button>
              <button onClick={() => handleDelete(note._id)}>Delete</button>
              <button onClick={() => handleSummarize(note)}>Summarize</button>
            </div>
            {summaryMap[note._id] && (
              <div className="note-summary">
                <strong>Summary:</strong>
                <p>{summaryMap[note._id]}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
