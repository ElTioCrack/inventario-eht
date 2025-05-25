import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ref, onValue, remove } from "firebase/database";
import { db } from "../firebase/config";
import MainLayout from "../components/MainLayout";
import "./../styles/ProductList.css";

function ProductList() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [orden, setOrden] = useState({ campo: "nombre", asc: true });
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);

  useEffect(() => {
    const productosRef = ref(db, "productos");
    const unsubscribe = onValue(productosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const lista = Object.entries(data).map(([id, prod]) => ({
          id,
          ...prod,
        }));
        setProductos(lista);
      }
    });
    return () => unsubscribe();
  }, []);

  const ordenarPor = (campo) => {
    const nuevaAsc = orden.campo === campo ? !orden.asc : true;
    setOrden({ campo, asc: nuevaAsc });
  };

  const productosFiltrados = productos
    .filter(
      (prod) =>
        prod.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        prod.categoriaNombre?.toLowerCase().includes(busqueda.toLowerCase())
    )
    .sort((a, b) => {
      const valA = a[orden.campo]?.toString().toLowerCase();
      const valB = b[orden.campo]?.toString().toLowerCase();
      if (valA < valB) return orden.asc ? -1 : 1;
      if (valA > valB) return orden.asc ? 1 : -1;
      return 0;
    });

  const total = productosFiltrados.length;
  const totalPaginas = Math.ceil(total / porPagina);
  const inicio = (pagina - 1) * porPagina;
  const productosPagina = productosFiltrados.slice(inicio, inicio + porPagina);

  const labelOrden = {
    nombre: "Nombre",
    categoriaNombre: "Categoría",
    cantidad: "Cantidad",
    precio: "Precio",
  };

  const iconoOrden = (campo) => {
    if (orden.campo !== campo) return "⬍";
    return orden.asc ? "🔼" : "🔽";
  };

  const eliminarProducto = (producto) => {
    const confirmado = window.confirm(
      `¿Estás seguro? Esta acción no se puede revertir.\n\nSe eliminará el producto "${producto.nombre}".`
    );
    if (confirmado) {
      const productoRef = ref(db, `productos/${producto.id}`);
      remove(productoRef);
    }
  };

  const generarRangoPaginas = () => {
    const totalBotones = 5;
    const pages = new Set();

    if (totalPaginas <= totalBotones) {
      for (let i = 1; i <= totalPaginas; i++) {
        pages.add(i);
      }
    } else {
      // Siempre mostrar la primera página
      pages.add(1);

      // Páginas intermedias con separación lógica
      if (pagina <= 3) {
        pages.add(2);
        pages.add(3);
        pages.add(4);
        pages.add("...");
      } else if (pagina >= totalPaginas - 2) {
        pages.add("...");
        pages.add(totalPaginas - 3);
        pages.add(totalPaginas - 2);
        pages.add(totalPaginas - 1);
      } else {
        pages.add("...");
        pages.add(pagina - 1);
        pages.add(pagina);
        pages.add(pagina + 1);
        pages.add("...");
      }

      // Siempre mostrar la última página
      pages.add(totalPaginas);
    }

    return Array.from(pages);
  };

  return (
    <MainLayout>
      <h2 className="subtitulo-productos centrado-horizontal">
        Listado de Productos
      </h2>

      {/* Filtros y Buscador */}
      <div className="fila-busqueda">
        <div className="contenedor-busqueda">
          <input
            type="text"
            placeholder="Buscar producto..."
            className="campo-busqueda"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value.trimStart());
              setPagina(1);
            }}
          />
          {busqueda && (
            <button className="boton-limpiar" onClick={() => setBusqueda("")}>
              ❌
            </button>
          )}
        </div>

        <button
          className="boton-agregar"
          onClick={() => navigate("/producto/nuevo")}
        >
          ➕ Añadir Producto
        </button>
      </div>

      {/* Orden actual */}
      <p className="info-orden">
        Orden: <strong>{labelOrden[orden.campo]}</strong>{" "}
        <span className="orden-direccion">
          ({orden.asc ? "Ascendente" : "Descendente"})
        </span>
      </p>

      {/* Tabla */}
      <table className="tabla-productos">
        <thead>
          <tr>
            <th className="derecha">Nº</th>
            <th className="ordenable" onClick={() => ordenarPor("nombre")}>
              Nombre {iconoOrden("nombre")}
            </th>
            <th
              className="ordenable"
              onClick={() => ordenarPor("categoriaNombre")}
            >
              Categoría {iconoOrden("categoriaNombre")}
            </th>
            <th
              className="ordenable derecha"
              onClick={() => ordenarPor("cantidad")}
            >
              Cantidad {iconoOrden("cantidad")}
            </th>
            <th
              className="ordenable derecha"
              onClick={() => ordenarPor("precio")}
            >
              Precio {iconoOrden("precio")}
            </th>
            <th className="imagen-centro">Foto</th>
            <th className="derecha">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productosPagina.map((producto, index) => (
            <tr key={producto.id}>
              <td className="derecha">{inicio + index + 1}</td>
              <td className="izquierda">{producto.nombre}</td>
              <td className="izquierda">{producto.categoriaNombre}</td>
              <td className="derecha">{producto.cantidad}</td>
              <td className="derecha">
                Bs. {Number(producto.precio).toFixed(2)}.-
              </td>
              <td className="imagen-centro">
                <img
                  src={producto.fotoUrl || "/assets/default_image.png"}
                  alt={producto.nombre}
                  onError={(e) => {
                    if (!e.target.dataset.errorHandled) {
                      e.target.dataset.errorHandled = true;
                      e.target.src = "/assets/default_image.png";
                    }
                  }}
                />
              </td>
              <td className="acciones-celda">
                <button
                  className="boton-accion editar"
                  onClick={() => navigate(`/producto/${producto.id}/editar`)}
                >
                  ✏️ Editar
                </button>
                <button
                  className="boton-accion eliminar"
                  onClick={() => eliminarProducto(producto)}
                >
                  🗑️ Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="paginacion-fila">
        {/* Izquierda */}
        <div className="paginacion-col paginacion-select">
          <select
            className="select-paginacion"
            value={porPagina}
            onChange={(e) => {
              setPorPagina(Number(e.target.value));
              setPagina(1);
            }}
          >
            <option value={2}>5 / página</option>
            <option value={10}>10 / página</option>
            <option value={20}>20 / página</option>
            <option value={50}>50 / página</option>
          </select>
        </div>

        {/* Centro */}
        <div className="paginacion-col paginacion-botones">
          {generarRangoPaginas().map((item, i) =>
            item === "..." ? (
              <span key={`puntos-${i}`} className="puntos-paginacion">
                ...
              </span>
            ) : (
              <button
                key={`pagina-${item}`}
                className={`boton-pagina ${pagina === item ? "activa" : ""}`}
                onClick={() => setPagina(item)}
              >
                {item}
              </button>
            )
          )}
        </div>

        {/* Derecha */}
        <div className="paginacion-col paginacion-info">
          Mostrando {inicio + 1} al {Math.min(inicio + porPagina, total)} de{" "}
          {productos.length} productos
          {busqueda && ` (coinciden con búsqueda: ${total})`}
        </div>
      </div>
    </MainLayout>
  );
}

export default ProductList;
