import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Edit, Trash2, CheckCircle, XCircle, Search, Book, Clock, AlertCircle, RefreshCw, Bell } from 'lucide-react';

const LibraryDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [fines, setFines] = useState([]);
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("inventory"); // inventory, requests, fines, mybooks

  const isLibrarian = ["Librarian", "Admin"].includes(user.role);

  // Form states
  const [showBookModal, setShowBookModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentBook, setCurrentBook] = useState({ title: '', author: '', isbn: '', quantity: 1, availableQuantity: 1 });

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestBookId, setRequestBookId] = useState(null);
  const [requestNote, setRequestNote] = useState("");

  const fetchData = async () => {
    try {
      const [booksRes, myBooksRes, reqRes, finesRes, notifRes] = await Promise.all([
        axios.get('/api/library/inventory'),
        isLibrarian ? axios.get('/api/library/issued') : axios.get('/api/library/my-books'),
        axios.get('/api/library-requests'),
        axios.get('/api/library/fines'),
        axios.get('/api/notifications')
      ]);
      setBooks(booksRes.data);
      setIssuedBooks(myBooksRes.data);
      setRequests(reqRes.data);
      setFines(finesRes.data);
      setNotifications(notifRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.role]);

  const markNotificationRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error(error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // LIBRARIAN ACTIONS
  const handleSaveBook = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await axios.put(`/api/library/${currentBook._id}`, currentBook);
      } else {
        await axios.post('/api/library/add', currentBook);
      }
      setShowBookModal(false);
      setCurrentBook({ title: '', author: '', isbn: '', quantity: 1, availableQuantity: 1 });
      setEditMode(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving book');
    }
  };

  const handleDeleteBook = async (id) => {
    if (window.confirm("Delete this book?")) {
      try {
        await axios.delete(`/api/library/${id}`);
        fetchData();
      } catch (error) {
        alert(error.response?.data?.message || 'Error deleting book');
      }
    }
  };

  const handleUpdateRequestStatus = async (id, status, studentId, bookId) => {
    try {
      await axios.put(`/api/library-requests/${id}`, { status });
      if (status === "Approved") {
        // Issue book automatically
        await axios.post('/api/library/issue', { bookId, userId: studentId, days: 14 });
      }
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating request');
    }
  };

  const handleReturnBook = async (issueId) => {
    try {
      await axios.post('/api/library/return', { issueId });
      alert("Book returned successfully");
      fetchData();
    } catch (error) {
       alert(error.response?.data?.message || 'Error returning book');
    }
  };

  // STUDENT ACTIONS
  const handleRequestBook = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/library-requests', { bookId: requestBookId, note: requestNote });
      setShowRequestModal(false);
      setRequestNote("");
      alert("Book requested successfully!");
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error requesting book');
    }
  };

  const filteredBooks = books.filter(b => b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center">
          <button onClick={() => navigate('/dashboard')} className="mr-4 text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Library Portal</h1>
        </div>
        <div className="flex items-center space-x-6">
          <div className="relative">
            <button onClick={() => setShowNotifications(!showNotifications)} className="text-gray-500 hover:text-gray-700 relative">
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                <div className="p-3 border-b bg-gray-50 font-bold text-gray-700">Notifications</div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n._id} 
                        onClick={() => !n.isRead && markNotificationRead(n._id)}
                        className={`p-3 border-b text-sm cursor-pointer hover:bg-gray-50 ${n.isRead ? 'text-gray-500' : 'text-gray-900 font-semibold bg-blue-50/50'}`}
                      >
                        {n.message}
                        <div className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
           {isLibrarian && (
             <button onClick={() => { setEditMode(false); setCurrentBook({ title: '', author: '', isbn: '', quantity: 1, availableQuantity: 1 }); setShowBookModal(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700">
               <Plus className="h-4 w-4 mr-1"/> Add Book
             </button>
           )}
        </div>
      </div>

      <div className="p-6 max-w-6xl w-full mx-auto flex-1">
         {/* Tabs */}
         <div className="flex space-x-4 border-b border-gray-200 mb-6">
           <button onClick={() => setActiveTab("inventory")} className={`pb-3 px-2 font-medium border-b-2 ${activeTab === 'inventory' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Inventory</button>
           {isLibrarian ? (
             <>
                <button onClick={() => setActiveTab("requests")} className={`pb-3 px-2 font-medium border-b-2 flex items-center ${activeTab === 'requests' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}>
                  Student Requests
                  {requests.filter(r => r.status === 'Pending').length > 0 && <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{requests.filter(r => r.status === 'Pending').length}</span>}
                </button>
                <button onClick={() => setActiveTab("issued")} className={`pb-3 px-2 font-medium border-b-2 ${activeTab === 'issued' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}>Issued Books</button>
                <button onClick={() => setActiveTab("fines")} className={`pb-3 px-2 font-medium border-b-2 ${activeTab === 'fines' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}>Fines Management</button>
             </>
           ) : (
             <>
                <button onClick={() => setActiveTab("mybooks")} className={`pb-3 px-2 font-medium border-b-2 ${activeTab === 'mybooks' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}>My Borrowed Books</button>
                <button onClick={() => setActiveTab("requests")} className={`pb-3 px-2 font-medium border-b-2 ${activeTab === 'requests' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}>My Requests</button>
                <button onClick={() => setActiveTab("fines")} className={`pb-3 px-2 font-medium border-b-2 ${activeTab === 'fines' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}>My Fines</button>
             </>
           )}
         </div>

         {/* Content */}
         {activeTab === "inventory" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">Book Catalog</h2>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input type="text" placeholder="Search books..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full border pl-9 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBooks.map(book => (
                  <div key={book._id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition bg-gray-50/50 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                       <h3 className="font-bold text-gray-900">{book.title}</h3>
                       {book.availableQuantity > 0 ? (
                         <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-medium">{book.availableQuantity} Available</span>
                       ) : (
                         <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-medium">Out of Stock</span>
                       )}
                    </div>
                    <p className="text-sm text-gray-500 mb-1">by {book.author}</p>
                    <p className="text-xs text-gray-400 mb-4">ISBN: {book.isbn}</p>
                    
                    <div className="mt-auto pt-4 flex space-x-2 border-t border-gray-100">
                      {isLibrarian ? (
                        <>
                          <button onClick={() => { setEditMode(true); setCurrentBook(book); setShowBookModal(true); }} className="flex-1 bg-white border border-gray-200 text-gray-600 py-1.5 rounded hover:bg-gray-50 text-sm font-medium flex justify-center items-center">
                            <Edit className="h-4 w-4 mr-1"/> Edit
                          </button>
                          <button onClick={() => handleDeleteBook(book._id)} className="px-3 bg-red-50 text-red-600 rounded hover:bg-red-100 flex justify-center items-center">
                            <Trash2 className="h-4 w-4"/>
                          </button>
                        </>
                      ) : (
                        <button 
                           disabled={book.availableQuantity === 0}
                           onClick={() => { setRequestBookId(book._id); setShowRequestModal(true); }} 
                           className={`flex-1 py-1.5 rounded text-sm font-medium transition ${book.availableQuantity > 0 ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                        >
                          Request Book
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
         )}

         {activeTab === "requests" && (
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6">
             <h2 className="text-lg font-bold text-gray-800 mb-4">{isLibrarian ? "Manage Student Requests" : "My Book Requests"}</h2>
             <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-gray-200">
                 <thead>
                   <tr>
                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Book</th>
                     {isLibrarian && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>}
                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                     {isLibrarian && <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-200">
                   {requests.map(req => (
                     <tr key={req._id}>
                       <td className="px-4 py-4 whitespace-nowrap">
                         <div className="font-medium text-gray-900">{req.bookId?.title}</div>
                         <div className="text-xs text-gray-500">Available: {req.bookId?.availableQuantity}</div>
                       </td>
                       {isLibrarian && (
                         <td className="px-4 py-4 whitespace-nowrap">
                           <div className="text-sm font-medium text-gray-900">{req.studentId?.name}</div>
                           <div className="text-xs text-gray-500">{req.studentId?.email}</div>
                           {req.note && <div className="text-xs text-gray-400 mt-1 italic">Note: {req.note}</div>}
                         </td>
                       )}
                       <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                         {new Date(req.createdAt).toLocaleDateString()}
                       </td>
                       <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${req.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : req.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {req.status}
                          </span>
                       </td>
                       {isLibrarian && (
                         <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                           {req.status === 'Pending' && (
                             <div className="flex justify-end space-x-2">
                               <button disabled={req.bookId?.availableQuantity <= 0} onClick={() => handleUpdateRequestStatus(req._id, 'Approved', req.studentId?._id, req.bookId?._id)} className="text-green-600 hover:text-green-800 p-1 border border-green-200 rounded disabled:opacity-50"><CheckCircle className="h-5 w-5"/></button>
                               <button onClick={() => handleUpdateRequestStatus(req._id, 'Rejected')} className="text-red-600 hover:text-red-800 p-1 border border-red-200 rounded"><XCircle className="h-5 w-5"/></button>
                             </div>
                           )}
                         </td>
                       )}
                     </tr>
                   ))}
                   {requests.length === 0 && <tr><td colSpan={isLibrarian ? 5 : 4} className="px-4 py-8 text-center text-gray-500">No requests found.</td></tr>}
                 </tbody>
               </table>
             </div>
           </div>
         )}

         {(activeTab === "mybooks" || activeTab === "issued") && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6">
             <h2 className="text-lg font-bold text-gray-800 mb-4">{isLibrarian ? "Currently Issued Books" : "My Borrowed Books"}</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {issuedBooks.map(issue => (
                 <div key={issue._id} className={`border rounded-xl p-4 shadow-sm relative overflow-hidden ${issue.isOverdue ? 'border-red-200 bg-red-50/30' : 'border-gray-200 bg-white'}`}>
                   {issue.isOverdue && <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold">OVERDUE</div>}
                   <div className="flex items-start mb-2">
                     <Book className={`h-8 w-8 mr-3 ${issue.isOverdue ? 'text-red-400' : 'text-indigo-400'}`} />
                     <div>
                       <h3 className="font-bold text-gray-900">{issue.bookId?.title}</h3>
                       {isLibrarian && <p className="text-sm text-gray-600">to {issue.userId?.name}</p>}
                     </div>
                   </div>
                   <div className="space-y-1 text-sm mt-4">
                     <div className="flex justify-between"><span className="text-gray-500">Issued:</span> <span>{new Date(issue.issueDate).toLocaleDateString()}</span></div>
                     <div className="flex justify-between"><span className="text-gray-500">Due:</span> <span className={issue.isOverdue ? "text-red-600 font-bold" : ""}>{new Date(issue.dueDate).toLocaleDateString()}</span></div>
                     {issue.isOverdue && <div className="flex justify-between"><span className="text-gray-500">Est. Fine:</span> <span className="text-red-600 font-bold">${issue.fine}</span></div>}
                   </div>
                   {isLibrarian && (
                     <button onClick={() => handleReturnBook(issue._id)} className="w-full mt-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-2 rounded flex justify-center items-center">
                       <RefreshCw className="h-4 w-4 mr-2" /> Mark as Returned
                     </button>
                   )}
                 </div>
               ))}
               {issuedBooks.length === 0 && <div className="col-span-full py-8 text-center text-gray-500">No issued books found.</div>}
             </div>
           </div>
         )}

         {activeTab === "fines" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6">
             <h2 className="text-lg font-bold text-gray-800 mb-4">{isLibrarian ? "All System Fines" : "My Fines"}</h2>
             <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Book</th>
                    {isLibrarian && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overdue Days</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {fines.map(fine => (
                    <tr key={fine._id}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{fine.bookId?.title}</td>
                      {isLibrarian && <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{fine.studentId?.name}</td>}
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600">{fine.overdueDays} days</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${fine.amount}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                         <span className={`px-2 py-1 text-xs rounded-full font-medium ${fine.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                           {fine.status}
                         </span>
                      </td>
                    </tr>
                  ))}
                  {fines.length === 0 && <tr><td colSpan={isLibrarian ? 5 : 4} className="px-4 py-8 text-center text-gray-500">No fines found.</td></tr>}
                </tbody>
             </table>
            </div>
         )}
      </div>

      {/* Book Form Modal */}
      {showBookModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">{editMode ? 'Edit Book' : 'Add New Book'}</h2>
            <form onSubmit={handleSaveBook} className="space-y-4">
              <input required type="text" placeholder="Book Title" value={currentBook.title} onChange={e => setCurrentBook({...currentBook, title: e.target.value})} className="w-full border p-2 rounded" />
              <input required type="text" placeholder="Author" value={currentBook.author} onChange={e => setCurrentBook({...currentBook, author: e.target.value})} className="w-full border p-2 rounded" />
              <input required type="text" placeholder="ISBN" value={currentBook.isbn} onChange={e => setCurrentBook({...currentBook, isbn: e.target.value})} className="w-full border p-2 rounded" />
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Total Quantity</label>
                  <input required type="number" min="1" value={currentBook.quantity} onChange={e => setCurrentBook({...currentBook, quantity: parseInt(e.target.value)})} className="w-full border p-2 rounded" />
                </div>
                {editMode && (
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Available Quantity</label>
                    <input required type="number" min="0" max={currentBook.quantity} value={currentBook.availableQuantity} onChange={e => setCurrentBook({...currentBook, availableQuantity: parseInt(e.target.value)})} className="w-full border p-2 rounded" />
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowBookModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save Book</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Book Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Request Book</h2>
            <form onSubmit={handleRequestBook} className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">You are about to request this book from the library. Provide an optional note.</p>
              <textarea placeholder="Note for librarian (optional)" value={requestNote} onChange={e => setRequestNote(e.target.value)} className="w-full border p-3 rounded-lg h-24 resize-none outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowRequestModal(false)} className="px-4 py-2 text-gray-600 font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">Send Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryDashboard;
