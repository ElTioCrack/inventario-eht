import React from "react";
import "../styles/MainLayout.css";

function MainLayout({ children }) {
  const añoInicio = 2025;
  const añoActual = new Date().getFullYear();
  const rangoAños =
    añoActual > añoInicio ? `${añoInicio} - ${añoActual}` : `${añoInicio}`;

  return (
    <div className="layout-productos">
      {/* Encabezado */}
      <header className="encabezado-productos">
        <div className="contenedor-central encabezado-contenido">
          <div className="contenedor-logo">
            <img src="/assets/logo_eht_2023.png" alt="Logo EHT" />
          </div>
          <h1 className="titulo-principal">Inventario EHT</h1>
        </div>
      </header>

      {/* Contenido dinámico */}
      <main className="zona-principal">
        <div className="contenedor-central">{children}</div>
      </main>

      {/* Pie de página */}
      <footer className="pie-pagina">
        <div className="contenedor-central contenido-footer">
          <p className="nombre-escuela">
            Primera Escuela de Hotelería y Turismo
          </p>
          <p className="ubicacion">La Paz - Bolivia</p>
          <p className="derechos">
            © {rangoAños} Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  );
}

export default MainLayout;
