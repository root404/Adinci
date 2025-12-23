import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, ArrowLeft, MessageSquarePlus, MoreVertical, Check, CheckCheck, User as UserIcon, Paperclip, Mic, Camera, Image, MapPin, FileText, Smile, X, Plus, Phone } from 'lucide-react';
import { ChatMessage, ChatSession, User } from '../types';

interface ChatScreenProps {
  currentUser: User;
  allUsers: User[];
  chats: ChatSession[];
  onSendMessage: (sessionId: string, text: string) => void;
  onCreateChat: (otherUserId: string) => void;
  isHighContrast: boolean;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ 
  currentUser, 
  allUsers, 
  chats, 
  onSendMessage, 
  onCreateChat,
  isHighContrast 
}) => {
  const [view, setView] = useState<'list' | 'chat' | 'new'>('list');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [showAttach, setShowAttach] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeChat = chats.find(c => c.id === activeChatId);
  const otherParticipantId = activeChat?.participants.find(p => p !== currentUser.id);
  const otherUser = allUsers.find(u => u.id === otherParticipantId);

  // Auto-scroll to bottom whenever messages change in the active chat
  useEffect(() => {
    if (view === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [view, activeChatId, activeChat?.messages.length]);

  // Filter chats relevant to current user
  const myChats = chats.filter(c => c.participants.includes(currentUser.id))
    .sort((a, b) => b.lastMessageTime - a.lastMessageTime);

  // Handle sending a message
  const handleSend = (textOverride?: string) => {
    const textToSend = textOverride || inputText;
    if (!textToSend.trim() || !activeChatId) return;
    onSendMessage(activeChatId, textToSend);
    setInputText('');
    setShowAttach(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  const handleCreateChatWrapper = (userId: string) => {
     onCreateChat(userId);
     setSearchQuery('');
     // In a real app we would navigate to the new chat ID, but here we go to list to see it appear
     setView('list');
  };

  // Find chat if we have an active ID even if we switched views
  useEffect(() => {
     if (activeChatId && !chats.find(c => c.id === activeChatId)) {
        setActiveChatId(null);
        setView('list');
     }
  }, [chats, activeChatId]);

  // Handle searching for users
  const filteredUsers = allUsers.filter(u => 
    u.id !== currentUser.id && 
    (u.phoneNumber?.includes(searchQuery) || u.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // --- VIEW: Chat List ---
  if (view === 'list') {
    return (
      <div className={`h-full flex flex-col relative ${isHighContrast ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
        {/* Header */}
        <div className={`p-4 flex justify-between items-center ${isHighContrast ? 'bg-gray-900 border-b border-yellow-400' : 'bg-white shadow-sm'}`}>
          <h1 className="text-2xl font-black tracking-tight">Messages</h1>
          <div className="flex gap-4">
             <Search size={24} className={`cursor-pointer ${isHighContrast ? 'opacity-100' : 'text-gray-700 hover:text-black'}`} />
             <MoreVertical size={24} className={`cursor-pointer ${isHighContrast ? 'opacity-100' : 'text-gray-700 hover:text-black'}`} />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto pb-20">
           {myChats.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-2 shadow-xl ${isHighContrast ? 'bg-yellow-400 text-black' : 'bg-indigo-50 text-indigo-600'}`}>
                   <MessageSquarePlus size={40} />
                </div>
                <div className="space-y-2 max-w-xs mx-auto">
                   <h2 className="text-2xl font-black">No Messages Yet</h2>
                   <p className={`text-sm font-medium leading-relaxed ${isHighContrast ? 'opacity-80' : 'text-gray-700'}`}>
                      Connect with Zone Owners and Advertisers to negotiate deals and discuss ad placements directly.
                   </p>
                </div>
                <button 
                  onClick={() => setView('new')}
                  className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 ${
                     isHighContrast ? 'bg-white text-black' : 'bg-indigo-600 text-white shadow-indigo-200'
                  }`}
                >
                  <Plus size={20} /> Start New Chat
                </button>
             </div>
           ) : (
             myChats.map(chat => {
                const pid = chat.participants.find(p => p !== currentUser.id);
                const partner = allUsers.find(u => u.id === pid);
                const lastMsg = chat.messages[chat.messages.length - 1];

                return (
                  <div 
                    key={chat.id} 
                    onClick={() => { setActiveChatId(chat.id); setView('chat'); }}
                    className={`flex items-center gap-4 p-4 border-b cursor-pointer transition-colors ${
                      isHighContrast 
                        ? 'border-gray-800 hover:bg-gray-900' 
                        : 'border-gray-100 hover:bg-white bg-white/50'
                    }`}
                  >
                     <div className="relative">
                       <div 
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0 overflow-hidden shadow-md"
                          style={{ backgroundColor: !partner?.avatar?.startsWith('http') ? (partner?.avatar || '#ccc') : undefined }}
                       >
                         {partner?.avatar?.startsWith('http') ? (
                            <img src={partner.avatar} className="w-full h-full object-cover" />
                         ) : (
                            partner?.name.charAt(0)
                         )}
                       </div>
                       <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                           <h3 className="font-bold text-base truncate">{partner?.name || 'Unknown User'}</h3>
                           <span className={`text-[10px] font-bold ${isHighContrast ? 'text-gray-400' : 'text-gray-600'}`}>
                             {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                           </span>
                        </div>
                        <p className={`text-sm truncate font-medium ${isHighContrast ? 'text-gray-400' : 'text-gray-700'}`}>
                           {lastMsg?.senderId === currentUser.id && <span className="text-gray-500">You: </span>}
                           {lastMsg?.text || 'No messages yet'}
                        </p>
                     </div>
                  </div>
                );
             })
           )}
        </div>

        {/* FAB */}
        {myChats.length > 0 && (
          <button 
            onClick={() => setView('new')}
            className={`absolute bottom-24 right-6 w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 ${
              isHighContrast ? 'bg-yellow-400 text-black' : 'bg-indigo-600 text-white shadow-indigo-200'
            }`}
          >
            <MessageSquarePlus size={24} />
          </button>
        )}
      </div>
    );
  }

  // --- VIEW: New Chat / Search ---
  if (view === 'new') {
    return (
      <div className={`h-full flex flex-col ${isHighContrast ? 'bg-black text-white' : 'bg-white text-gray-900'}`}>
         <div className={`p-4 flex items-center gap-3 ${isHighContrast ? 'bg-gray-900 border-b border-yellow-400' : 'bg-white shadow-sm'}`}>
            <button onClick={() => setView('list')}><ArrowLeft size={24} /></button>
            <div className="flex-1">
               <h1 className="font-bold text-lg">Select Contact</h1>
               <p className={`text-xs font-bold ${isHighContrast ? 'opacity-60' : 'text-gray-600'}`}>{allUsers.length - 1} contacts available</p>
            </div>
         </div>
         
         <div className={`p-4 ${isHighContrast ? 'bg-black' : 'bg-gray-50'}`}>
            <div className={`flex items-center gap-2 p-3 rounded-xl transition-all ${isHighContrast ? 'bg-gray-900 border border-yellow-400' : 'bg-white shadow-sm focus-within:ring-2 ring-indigo-500'}`}>
               <Search size={20} className={`${isHighContrast ? 'opacity-50' : 'text-gray-500'}`} />
               <input 
                 autoFocus
                 placeholder="Search by name or number..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className={`flex-1 bg-transparent outline-none font-medium ${isHighContrast ? 'text-white placeholder-gray-500' : 'text-gray-900'}`}
               />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto pb-20">
            {searchQuery && filteredUsers.length === 0 && (
               <div className="p-8 text-center opacity-60">
                  <p className="mb-2 font-bold">User not found.</p>
                  <button 
                    onClick={() => alert(`Invitation sent to ${searchQuery} via SMS!`)}
                    className="text-indigo-600 font-black uppercase tracking-wider text-xs bg-indigo-50 px-4 py-2 rounded-lg"
                  >
                    Invite to App
                  </button>
               </div>
            )}

            {filteredUsers.map(u => (
               <div 
                 key={u.id}
                 onClick={() => handleCreateChatWrapper(u.id)}
                 className={`flex items-center gap-4 p-4 border-b cursor-pointer ${
                    isHighContrast ? 'border-gray-800 hover:bg-gray-900' : 'border-gray-100 hover:bg-gray-50'
                 }`}
               >
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-lg overflow-hidden shadow-sm"
                    style={{ backgroundColor: !u.avatar?.startsWith('http') ? (u.avatar || '#ccc') : undefined }}
                  >
                    {u.avatar?.startsWith('http') ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.name.charAt(0)}
                  </div>
                  <div>
                     <h3 className="font-bold text-base">{u.name}</h3>
                     <p className={`text-xs font-medium ${isHighContrast ? 'opacity-60' : 'text-gray-600'}`}>{u.bio || 'Available'}</p>
                  </div>
               </div>
            ))}
         </div>
      </div>
    );
  }

  // --- VIEW: Conversation ---
  // Added pb-16 to ensure input box clears the fixed bottom navigation
  return (
    <div className={`h-full flex flex-col relative pb-16 ${isHighContrast ? 'bg-black text-white' : 'bg-slate-100'}`}>
       {/* Chat Header */}
       <div className={`p-3 flex items-center gap-3 shadow-sm z-10 ${isHighContrast ? 'bg-gray-900 border-b border-yellow-400' : 'bg-white text-gray-900'}`}>
          <button onClick={() => setView('list')} className={`p-2 rounded-full transition-colors ${isHighContrast ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
            <ArrowLeft size={24} />
          </button>
          
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shadow-sm"
            style={{ backgroundColor: !otherUser?.avatar?.startsWith('http') ? (otherUser?.avatar || '#ccc') : undefined }}
          >
             {otherUser?.avatar?.startsWith('http') ? (
               <img src={otherUser.avatar} className="w-full h-full object-cover" />
             ) : (
               <span className="font-bold text-white">{otherUser?.name.charAt(0)}</span>
             )}
          </div>
          
          <div className="flex-1 cursor-pointer">
             <h3 className="font-bold text-sm leading-tight">{otherUser?.name || 'Unknown'}</h3>
             <p className="text-[10px] text-green-600 font-bold uppercase tracking-wide">Active Now</p>
          </div>

          <div className="flex gap-2 pr-1">
             <button className={`p-2 rounded-full ${isHighContrast ? 'hover:bg-gray-800' : 'hover:bg-gray-100 text-gray-700'}`}><Phone size={20} /></button>
             <button className={`p-2 rounded-full ${isHighContrast ? 'hover:bg-gray-800' : 'hover:bg-gray-100 text-gray-700'}`}><MoreVertical size={20} /></button>
          </div>
       </div>

       {/* Messages Area */}
       <div 
         className="flex-1 overflow-y-auto p-4 space-y-3"
         style={isHighContrast ? {} : { backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}
       >
          {activeChat?.messages.map((msg, idx) => {
             const isMe = msg.senderId === currentUser.id;
             const showTail = idx === 0 || activeChat.messages[idx-1]?.senderId !== msg.senderId;
             
             // Dynamic Bubble Styling - Modernized
             const bubbleBaseClass = `max-w-[80%] min-w-[60px] px-4 py-2.5 relative shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
               isMe 
                 ? (isHighContrast ? 'bg-yellow-400 text-black' : 'bg-indigo-600 text-white') 
                 : (isHighContrast ? 'bg-gray-800 text-white border border-yellow-400' : 'bg-white text-gray-800')
             }`;
             
             // Specific rounding for top/bottom of groups
             const isFirstInGroup = idx === 0 || activeChat.messages[idx-1].senderId !== msg.senderId;
             const isLastInGroup = idx === activeChat.messages.length - 1 || activeChat.messages[idx+1].senderId !== msg.senderId;
             
             const roundedClass = isMe 
               ? `${isFirstInGroup ? 'rounded-tr-2xl' : 'rounded-tr-md'} ${isLastInGroup ? 'rounded-br-sm' : 'rounded-br-md'} rounded-l-2xl`
               : `${isFirstInGroup ? 'rounded-tl-2xl' : 'rounded-tl-md'} ${isLastInGroup ? 'rounded-bl-sm' : 'rounded-bl-md'} rounded-r-2xl`;

             return (
               <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group animate-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`${bubbleBaseClass} ${roundedClass}`}>
                     <p className="font-medium">{msg.text}</p>
                     <div className={`flex justify-end items-center gap-1 mt-1 ${isMe ? 'opacity-70' : 'text-gray-500'}`}>
                        <span className="text-[9px] font-bold">
                           {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        {isMe && (
                           <CheckCheck size={12} />
                        )}
                     </div>
                  </div>
               </div>
             );
          })}
          <div ref={messagesEndRef} />
       </div>

       {/* Attachment Menu */}
       {showAttach && (
          <div className={`mx-4 mb-2 p-4 rounded-2xl shadow-xl flex flex-wrap justify-around gap-4 animate-in slide-in-from-bottom-5 z-20 ${isHighContrast ? 'bg-gray-900 border border-yellow-400' : 'bg-white'}`}>
             <button onClick={() => handleSend("📄 Document")} className="flex flex-col items-center gap-1 group">
                <div className="w-12 h-12 rounded-full bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center text-indigo-600 transition-colors"><FileText /></div>
                <span className="text-xs font-bold text-gray-700">Document</span>
             </button>
             <button onClick={() => handleSend("📷 Photo")} className="flex flex-col items-center gap-1 group">
                <div className="w-12 h-12 rounded-full bg-pink-50 group-hover:bg-pink-100 flex items-center justify-center text-pink-600 transition-colors"><Camera /></div>
                <span className="text-xs font-bold text-gray-700">Camera</span>
             </button>
             <button onClick={() => handleSend("🖼️ Gallery")} className="flex flex-col items-center gap-1 group">
                <div className="w-12 h-12 rounded-full bg-purple-50 group-hover:bg-purple-100 flex items-center justify-center text-purple-600 transition-colors"><Image /></div>
                <span className="text-xs font-bold text-gray-700">Gallery</span>
             </button>
             <button onClick={() => handleSend("📍 Location")} className="flex flex-col items-center gap-1 group">
                <div className="w-12 h-12 rounded-full bg-green-50 group-hover:bg-green-100 flex items-center justify-center text-green-600 transition-colors"><MapPin /></div>
                <span className="text-xs font-bold text-gray-700">Location</span>
             </button>
          </div>
       )}

       {/* Input Area (Chat Box) */}
       <div className={`p-3 flex items-end gap-2 z-20 ${isHighContrast ? 'bg-gray-900 border-t border-yellow-400' : 'bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]'}`}>
          <button 
             onClick={() => setShowAttach(!showAttach)} 
             className={`mb-2 p-2 rounded-full transition-transform hover:bg-gray-100 ${showAttach ? 'rotate-45' : ''} ${isHighContrast ? 'text-yellow-400 hover:bg-gray-800' : 'text-gray-600'}`}
          >
             {showAttach ? <X size={24} /> : <Plus size={24} />}
          </button>
          
          <div className={`flex-1 flex items-end rounded-2xl px-4 py-2 transition-shadow ${isHighContrast ? 'bg-black border border-yellow-400' : 'bg-gray-50 focus-within:ring-2 ring-indigo-100'}`}>
             <textarea 
               ref={textareaRef}
               value={inputText}
               onChange={handleInput}
               onKeyDown={e => {
                 if (e.key === 'Enter' && !e.shiftKey) {
                   e.preventDefault();
                   handleSend();
                   if (textareaRef.current) textareaRef.current.style.height = 'auto';
                 }
               }}
               placeholder="Type a message..."
               rows={1}
               className={`flex-1 bg-transparent border-none outline-none text-sm resize-none py-2 max-h-32 min-h-[24px] font-medium ${isHighContrast ? 'text-yellow-400 placeholder-gray-500' : 'text-gray-900'}`}
             />
             <div className="flex items-center gap-2 mb-2 ml-2">
                <Smile size={20} className={`cursor-pointer hover:scale-110 transition-transform ${isHighContrast ? 'text-gray-500' : 'text-gray-600'}`} />
                <Camera size={20} onClick={() => handleSend("📷 Photo")} className={`cursor-pointer hover:scale-110 transition-transform ${isHighContrast ? 'text-gray-500' : 'text-gray-600'}`} />
             </div>
          </div>
          
          {inputText.trim() ? (
            <button 
              onClick={() => handleSend()}
              className={`mb-2 p-3 rounded-full transition-all active:scale-90 hover:shadow-lg ${
                 isHighContrast ? 'bg-yellow-400 text-black' : 'bg-indigo-600 text-white shadow-indigo-200'
              }`}
            >
               <Send size={20} />
            </button>
          ) : (
            <button 
              onClick={() => handleSend("🎤 Voice Message (0:05)")}
              className={`mb-2 p-3 rounded-full transition-all active:scale-90 hover:shadow-lg ${
                 isHighContrast ? 'bg-yellow-400 text-black' : 'bg-indigo-600 text-white shadow-indigo-200'
              }`}
            >
               <Mic size={20} />
            </button>
          )}
       </div>
    </div>
  );
};