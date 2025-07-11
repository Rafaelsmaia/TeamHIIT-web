import React from 'react';
import { Menu, User, Bell } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Menu className="w-6 h-6 text-gray-600 cursor-pointer" />
            <h1 className="text-2xl font-bold text-gray-900">Team HIIT</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Bell className="w-6 h-6 text-gray-600 cursor-pointer" />
            <User className="w-6 h-6 text-gray-600 cursor-pointer" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

