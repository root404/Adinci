import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, ArrowLeft, MessageSquarePlus, MoreVertical, Check, CheckCheck, User as UserIcon, Paperclip, Mic, Camera, Image, MapPin, FileText, Smile, X } from 'lucide-react';
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
      <div className={`h-full flex flex-col relative ${isHighContrast ? 'bg-black text-white' : 'bg-white text-gray-900'}`}>
        {/* Header */}
        <div className={`p-4 flex justify-between items-center ${isHighContrast ? 'bg-gray-900 border-b border-yellow-400' : 'bg-white shadow-sm'}`}>
          <h1 className="text-2xl font-bold">Chats</h1>
          <div className="flex gap-4">
             <Search size={24} className="opacity-60 hover:opacity-100 cursor-pointer" />
             <MoreVertical size={24} className="opacity-60 hover:opacity-100 cursor-pointer" />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto pb-20">
           {myChats.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full opacity-50 p-6 text-center">
                <MessageSquarePlus size={48} className="mb-4" />
                <p>No chats yet. Start a conversation!</p>
                <button 
                  onClick={() => setView('new')}
                  className="mt-4 text-blue-500 font-bold"
                >
                  Start New Chat
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
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                     <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0 overflow-hidden"
                        style={{ backgroundColor: !partner?.avatar?.startsWith('http') ? (partner?.avatar || '#ccc') : undefined }}
                     >
                       {partner?.avatar?.startsWith('http') ? (
                          <img src={partner.avatar} className="w-full h-full object-cover" />
                       ) : (
                          partner?.name.charAt(0)
                       )}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                           <h3 className="font-bold truncate">{partner?.name || 'Unknown User'}</h3>
                           <span className={`text-xs ${isHighContrast ? 'text-gray-400' : 'text-gray-500'}`}>
                             {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                           </span>
                        </div>
                        <p className={`text-sm truncate ${isHighContrast ? 'text-gray-400' : 'text-gray-500'}`}>
                           {lastMsg?.text || 'No messages yet'}
                        </p>
                     </div>
                  </div>
                );
             })
           )}
        </div>

        {/* FAB */}
        <button 
          onClick={() => setView('new')}
          className={`absolute bottom-24 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95 ${
            isHighContrast ? 'bg-yellow-400 text-black' : 'bg-green-500 text-white'
          }`}
        >
          <MessageSquarePlus size={24} />
        </button>
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
               <p className="text-xs opacity-60">{allUsers.length - 1} contacts available</p>
            </div>
         </div>
         
         <div className={`p-4 ${isHighContrast ? 'bg-black' : 'bg-gray-50'}`}>
            <div className={`flex items-center gap-2 p-3 rounded-lg ${isHighContrast ? 'bg-gray-900 border border-yellow-400' : 'bg-white border'}`}>
               <Search size={20} className="opacity-50" />
               <input 
                 autoFocus
                 placeholder="Search by name or number..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className={`flex-1 bg-transparent outline-none ${isHighContrast ? 'text-white placeholder-gray-500' : 'text-gray-900'}`}
               />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto pb-20">
            {searchQuery && filteredUsers.length === 0 && (
               <div className="p-8 text-center opacity-60">
                  <p className="mb-2">User not found.</p>
                  <button 
                    onClick={() => alert(`Invitation sent to ${searchQuery} via SMS!`)}
                    className="text-green-500 font-bold underline"
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
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm overflow-hidden"
                    style={{ backgroundColor: !u.avatar?.startsWith('http') ? (u.avatar || '#ccc') : undefined }}
                  >
                    {u.avatar?.startsWith('http') ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.name.charAt(0)}
                  </div>
                  <div>
                     <h3 className="font-bold">{u.name}</h3>
                     <p className="text-xs opacity-60">{u.bio || 'Available'}</p>
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
    <div className={`h-full flex flex-col relative pb-16 ${isHighContrast ? 'bg-black text-white' : 'bg-[#efeae2]'}`}>
       {/* Chat Header */}
       <div className={`p-2 flex items-center gap-2 ${isHighContrast ? 'bg-gray-900 border-b border-yellow-400' : 'bg-[#008069] text-white shadow-md'}`}>
          <button onClick={() => setView('list')} className="p-2 rounded-full hover:bg-white/10"><ArrowLeft size={24} /></button>
          
          <div 
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: !otherUser?.avatar?.startsWith('http') ? (otherUser?.avatar) : undefined }}
          >
             {otherUser?.avatar?.startsWith('http') ? (
               <img src={otherUser.avatar} className="w-full h-full object-cover" />
             ) : (
               <span className="font-bold">{otherUser?.name.charAt(0)}</span>
             )}
          </div>
          
          <div className="flex-1 cursor-pointer">
             <h3 className="font-bold text-sm leading-tight">{otherUser?.name || 'Unknown'}</h3>
             <p className="text-[10px] opacity-80">{otherUser?.phoneNumber || 'Online'}</p>
          </div>

          <div className="flex gap-1 pr-1">
             <button className="p-2 rounded-full hover:bg-white/10"><MoreVertical size={20} /></button>
          </div>
       </div>

       {/* Messages Area */}
       <div 
         className="flex-1 overflow-y-auto p-4 space-y-2 bg-repeat"
         style={!isHighContrast ? { backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', opacity: 0.95 } : {}}
       >
          {activeChat?.messages.map((msg, idx) => {
             const isMe = msg.senderId === currentUser.id;
             const showTail = idx === 0 || activeChat.messages[idx-1]?.senderId !== msg.senderId;
             
             // Dynamic Bubble Styling
             const bubbleBaseClass = `max-w-[80%] min-w-[80px] px-3 py-1 relative shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
               isMe 
                 ? (isHighContrast ? 'bg-yellow-400 text-black rounded-l-lg rounded-br-lg' : 'bg-[#d9fdd3] text-gray-900 rounded-l-lg rounded-br-lg') 
                 : (isHighContrast ? 'bg-gray-800 text-white border border-yellow-400 rounded-r-lg rounded-bl-lg' : 'bg-white text-gray-900 rounded-r-lg rounded-bl-lg')
             }`;
             
             // Specific rounding for top/bottom of groups
             const isFirstInGroup = idx === 0 || activeChat.messages[idx-1].senderId !== msg.senderId;
             const isLastInGroup = idx === activeChat.messages.length - 1 || activeChat.messages[idx+1].senderId !== msg.senderId;
             
             const roundedClass = isMe 
               ? `${isFirstInGroup ? 'rounded-tr-none' : 'rounded-tr-lg'} ${isLastInGroup ? 'rounded-br-lg' : 'rounded-br-lg'}`
               : `${isFirstInGroup ? 'rounded-tl-none' : 'rounded-tl-lg'} ${isLastInGroup ? 'rounded-bl-lg' : 'rounded-bl-lg'}`;

             return (
               <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group mb-1`}>
                  <div className={`${bubbleBaseClass} ${roundedClass}`}>
                     {/* Tail (Pseudo-element simulated) */}
                     {isFirstInGroup && (
                        <div className={`absolute top-0 w-3 h-3 ${isMe ? '-right-2' : '-left-2'}`}>
                           <svg viewBox="0 0 10 10" className={`w-full h-full ${isMe ? (isHighContrast ? 'text-yellow-400' : 'text-[#d9fdd3]') : (isHighContrast ? 'text-gray-800' : 'text-white')} fill-current`}>
                              <path d={isMe ? "M0,0 L10,0 L0,10 Z" : "M10,0 L0,0 L10,10 Z"} />
                           </svg>
                        </div>
                     )}

                     <p>{msg.text}</p>
                     <div className="flex justify-end items-center gap-1 mt-1">
                        <span className={`text-[9px] ${isMe ? (isHighContrast ? 'text-black/60' : 'text-gray-500') : 'text-gray-400'}`}>
                           {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        {isMe && (
                           // Just a visual simulation of 'read' status
                           <CheckCheck size={14} className={isHighContrast ? 'text-black' : 'text-blue-500'} />
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
          <div className={`mx-2 mb-2 p-4 rounded-xl shadow-xl flex flex-wrap justify-around gap-4 animate-in slide-in-from-bottom-5 ${isHighContrast ? 'bg-gray-900 border border-yellow-400' : 'bg-white'}`}>
             <button onClick={() => handleSend("📄 Document")} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white"><FileText /></div>
                <span className="text-xs">Document</span>
             </button>
             <button onClick={() => handleSend("📷 Photo")} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-pink-500 flex items-center justify-center text-white"><Camera /></div>
                <span className="text-xs">Camera</span>
             </button>
             <button onClick={() => handleSend("🖼️ Gallery")} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white"><Image /></div>
                <span className="text-xs">Gallery</span>
             </button>
             <button onClick={() => handleSend("📍 Location")} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white"><MapPin /></div>
                <span className="text-xs">Location</span>
             </button>
          </div>
       )}

       {/* Input Area (Chat Box) */}
       <div className={`p-2 flex items-end gap-2 ${isHighContrast ? 'bg-gray-900 border-t border-yellow-400' : 'bg-[#f0f2f5]'}`}>
          <button 
             onClick={() => setShowAttach(!showAttach)} 
             className={`mb-2 p-2 rounded-full transition-transform ${showAttach ? 'rotate-45' : ''} ${isHighContrast ? 'text-yellow-400' : 'text-gray-500 hover:bg-gray-200'}`}
          >
             {showAttach ? <X size={24} /> : <Paperclip size={24} />}
          </button>
          
          <div className={`flex-1 flex items-end rounded-2xl px-4 py-2 ${isHighContrast ? 'bg-black border border-yellow-400' : 'bg-white shadow-sm'}`}>
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
               placeholder="Type a message"
               rows={1}
               className={`flex-1 bg-transparent border-none outline-none text-sm resize-none py-2 max-h-32 min-h-[24px] ${isHighContrast ? 'text-yellow-400 placeholder-gray-500' : 'text-gray-900'}`}
             />
             <div className="flex items-center gap-2 mb-2 ml-2">
                <Smile size={20} className={`cursor-pointer ${isHighContrast ? 'text-gray-500' : 'text-gray-400'}`} />
                <Camera size={20} onClick={() => handleSend("📷 Photo")} className={`cursor-pointer ${isHighContrast ? 'text-gray-500' : 'text-gray-400'}`} />
             </div>
          </div>
          
          {inputText.trim() ? (
            <button 
              onClick={() => handleSend()}
              className={`mb-2 p-3 rounded-full transition-all active:scale-95 ${
                 isHighContrast ? 'bg-yellow-400 text-black' : 'bg-[#008069] text-white shadow-md'
              }`}
            >
               <Send size={20} />
            </button>
          ) : (
            <button 
              onClick={() => handleSend("🎤 Voice Message (0:05)")}
              className={`mb-2 p-3 rounded-full transition-all active:scale-95 ${
                 isHighContrast ? 'bg-yellow-400 text-black' : 'bg-[#008069] text-white shadow-md'
              }`}
            >
               <Mic size={20} />
            </button>
          )}
       </div>
    </div>
  );
};