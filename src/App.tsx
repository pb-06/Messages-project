import { Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home';
import { Auth } from './pages/Auth';
import { Account } from './pages/Account';
import { Admin } from './pages/Admin';
import './App.css'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth/:pathname" element={<Auth />} />
      <Route path="/account/:pathname" element={<Account />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}