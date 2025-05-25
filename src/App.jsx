import { HashRouter as Router, Routes, Route } from "react-router-dom";

import ProductList from "./pages/ProductList";
import ProductForm from "./pages/ProductForm";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ProductList />} />
        <Route path="/producto/nuevo" element={<ProductForm />} />
        <Route path="/producto/:id/editar" element={<ProductForm />} />
      </Routes>
    </Router>
  );
}

export default App;
