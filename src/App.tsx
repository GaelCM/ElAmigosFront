
import { useState } from 'react';
import './App.css'
import NavBar from './components/navbar'
import Sidebar from './components/sidebar';


export default function App() {
  const [sidebarOpen,setSidebarOpen]=useState(false);

  return (
    <>
      <div className="flex h-screen bg-background">
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} ></Sidebar>
          <NavBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}></NavBar>
      </div>
    </>
  )
}

