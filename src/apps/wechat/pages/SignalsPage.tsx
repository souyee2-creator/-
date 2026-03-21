import React from 'react';
import { AICharacter } from '../types';

interface SignalsPageProps {
  characters: AICharacter[];
  onChatClick: (contact: any) => void;
}

export const SignalsPage: React.FC<SignalsPageProps> = ({ characters, onChatClick }) => {
  const allContacts = characters.map(char => ({
    id: char.id,
    name: char.remark || char.realName,
    avatar: char.avatar,
    lastMsg: char.messages && char.messages.length > 0 ? char.messages[char.messages.length - 1].text : '',
    time: char.messages && char.messages.length > 0 
      ? char.messages[char.messages.length - 1].time 
      : new Date(char.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isSystem: false,
    initials: (char.remark || char.realName).charAt(0).toUpperCase(),
    personality: char.personality,
    messages: char.messages
  }));

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="divide-y divide-black/5">
        {allContacts.map(contact => (
          <div 
            key={contact.id} 
            onClick={() => onChatClick(contact)}
            className="flex items-center gap-4 p-4 hover:bg-black/5 transition-colors cursor-pointer"
          >
            {contact.isSystem ? (
              <div className="w-12 h-12 rounded-xl bg-black/5 border border-black/5 flex items-center justify-center text-2xl shadow-sm">
                {contact.avatar}
              </div>
            ) : contact.avatar ? (
              <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-xl object-cover border border-black/5 shadow-sm" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-black/5 border border-black/5 flex items-center justify-center text-black/30 font-bold text-xl shadow-inner">
                {contact.initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-semibold text-black truncate">{contact.name}</h3>
                <span className="text-[10px] font-medium text-black/30 uppercase tracking-wider">{contact.time}</span>
              </div>
              <p className="text-sm text-black/40 truncate">{contact.lastMsg || '暂无消息'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};