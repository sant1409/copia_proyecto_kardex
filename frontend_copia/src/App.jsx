import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing/Landing";
import IniciarSesion from "./pages/IniciarSesion/IniciarSesion";
import Registrar from "./pages/Registrarse/Registro";
import Dashboard from "./components/Dashboard/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import HomeDashboard from "./components/Dashboard/HomeDashboard";
import Perfil from "./pages/Perfil/Perfil";
import Kardex from "./pages/Kardex/Kardex";
import Insumos from "./pages/Insumos/Insumos";
import Inventario from"./pages/Inventario/Inventario";
import StockInventario from "./pages/StockInventario/StockInventario"
import Admin from "./pages/Admin/Admin";


import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/iniciar-sesion" element={<IniciarSesion />} />
        <Route path="/registrarse" element={<Registrar />} />
         <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>}>
            <Route index element={<HomeDashboard />} />
        <Route path="perfil" element={<Perfil />} />
         <Route path="kardex" element={<Kardex />} />
          <Route path="insumos" element={<Insumos />} />
          <Route path="inventario" element={<Inventario />} />
          <Route path="kardex/:id" element={<Kardex />} />
          <Route path="insumos/:id" element={<Insumos />} />
          <Route path="stockinventario" element={<StockInventario />} />
           <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
    
  );
}

export default App;




