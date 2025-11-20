import React, { useState } from 'react';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import RightSidebar from './components/RightSidebar';

function App() {
  const [selectedCharacterId, setSelectedCharacterId] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  // Mock data - in a real app this would come from a store or API
  const characters = [
    { id: 1, name: 'Atlas', role: 'Guide', avatar: 'A' },
    { id: 2, name: 'Luna', role: 'Creative Assistant', avatar: 'L' },
    { id: 3, name: 'Nova', role: 'Data Analyst', avatar: 'N' },
    { id: 4, name: 'Orion', role: 'Strategist', avatar: 'O' },
  ];

  const selectedCharacter = characters.find(c => c.id === selectedCharacterId) || characters[0];

  return (
    <Layout
      sidebar={
        <Sidebar
          selectedId={selectedCharacterId}
          onSelectCharacter={setSelectedCharacterId}
        />
      }
      isSidebarOpen={isSidebarOpen}
      rightSidebar={<RightSidebar character={selectedCharacter} />}
      isRightSidebarOpen={isRightSidebarOpen}
    >
      <ChatArea
        character={selectedCharacter}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
        isRightSidebarOpen={isRightSidebarOpen}
      />
    </Layout>
  );
}

export default App;
