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
  const [estadoCarga, setEstadoCarga] = useState("cargando"); // "cargando", "ok", "error", "vacio"

  useEffect(() => {
    const productosRef = ref(db, "productos");
    const unsubscribe = onValue(
      productosRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const lista = Object.entries(data).map(([id, prod]) => ({
            id,
            ...prod,
          }));
          setProductos(lista);
          setEstadoCarga("ok");
        } else {
          setProductos([]);
          setEstadoCarga("vacio");
        }
      },
      (error) => {
        console.error("❌ Error al obtener productos:", error);
        setProductos([]);
        setEstadoCarga("error");
      }
    );
    return () => unsubscribe();
  }, []);

  const [textoCarga, setTextoCarga] = useState("Cargando.");

  useEffect(() => {
    if (estadoCarga === "cargando") {
      const interval = setInterval(() => {
        setTextoCarga((prev) =>
          prev === "Cargando..." ? "Cargando." : prev + "."
        );
      }, 400);
      return () => clearInterval(interval);
    }
  }, [estadoCarga]);

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

  const mostrarTodo = porPagina === 0;
  const totalPaginas = mostrarTodo ? 1 : Math.ceil(total / porPagina);
  const inicio = mostrarTodo ? 0 : (pagina - 1) * porPagina;
  const productosPagina = mostrarTodo
    ? productosFiltrados
    : productosFiltrados.slice(inicio, inicio + porPagina);

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
    const mostrarTodo = porPagina === 0;
    if (mostrarTodo || total <= 0) return [];

    const pages = ["anterior"];
    const last = totalPaginas;

    pages.push(1); // Siempre mostrar la primera

    if (last <= 5) {
      for (let i = 2; i <= last; i++) pages.push(i);
    } else {
      if (pagina === 1) {
        pages.push(2, "...", last);
      } else if (pagina === 2) {
        pages.push(2, 3, "...", last);
      } else if (pagina === 3) {
        pages.push(2, 3, 4, "...", last);
      } else if (pagina === 4) {
        pages.push("...", 3, 4, 5, "...", last);
      } else if (pagina === last - 2) {
        pages.push("...", pagina - 1, pagina, pagina + 1, last);
      } else if (pagina === last - 1) {
        pages.push("...", pagina - 1, pagina, last);
      } else if (pagina === last) {
        pages.push("...", pagina - 1, last);
      } else {
        pages.push("...", pagina - 1, pagina, pagina + 1, "...", last);
      }
    }

    pages.push("siguiente");
    return pages;
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

      {/* Tabla */}
      {estadoCarga === "cargando" && (
        <div className="estado-mensaje centrado-horizontal">
          <p>{textoCarga}</p>
        </div>
      )}

      {estadoCarga === "error" && (
        <div className="estado-mensaje centrado-horizontal">
          <p>❌ Error al obtener los datos.</p>
        </div>
      )}

      {estadoCarga === "vacio" && (
        <div className="estado-mensaje centrado-horizontal">
          <p>📭 No hay productos registrados.</p>
        </div>
      )}

      {estadoCarga === "ok" && (
        <>
          {productosFiltrados.length === 0 ? (
            <div className="estado-mensaje centrado-horizontal">
              <p>
                🔍 No se encontraron productos que coincidan con la búsqueda.
              </p>
            </div>
          ) : (
            <>
              {/* Orden actual */}
              <p className="info-orden">
                Orden: <strong>{labelOrden[orden.campo]}</strong>{" "}
                <span className="orden-direccion">
                  ({orden.asc ? "Ascendente" : "Descendente"})
                </span>
              </p>
              {/* Tabla */}
              <div className="tabla-scroll-horizontal">
                <table className="tabla-productos">
                  <thead>
                    <tr>
                      <th className="derecha">Nº</th>
                      <th
                        className="ordenable"
                        onClick={() => ordenarPor("nombre")}
                      >
                        Nombre {iconoOrden("nombre")}
                      </th>
                      <th
                        className="ordenable"
                        onClick={() => ordenarPor("categoriaNombre")}
                      >
                        Categoría {iconoOrden("categoriaNombre")}
                      </th>
                      <th className="derecha">Precio</th>
                      <th className="derecha">Cantidad</th>

                      <th className="imagen-centro">Foto</th>
                      <th className="derecha">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosPagina.map((producto, index) => (
                      <tr key={producto.id}>
                        <td className="derecha">{inicio + index + 1}</td>
                        <td className="izquierda con-multilinea">
                          {producto.nombre || "Sin nombre"}
                        </td>
                        <td className="izquierda con-multilinea">
                          {producto.categoriaNombre || "Sin categoría"}
                        </td>
                        <td className="derecha con-multilinea">
                          {producto.precio || "Sin precio"}
                        </td>
                        <td className="derecha con-multilinea">
                          {producto.cantidad || "Sin cantidad"}
                        </td>
                        <td className="imagen-centro">
                          <img
                            src={
                              producto.urlImagen
                                ? producto.urlImagen ||
                                  "/assets/default_image.png"
                                : producto.imagenBase64.startsWith("data:image")
                                ? producto.imagenBase64
                                : `data:image/png;base64,${producto.imagenBase64}`
                            }
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
                            onClick={() =>
                              navigate(`/producto/${producto.id}/editar`)
                            }
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
              </div>

              {/* Paginación */}
              <div className="zona-paginacion-v2">
                <div className="fila-paginacion-centrada">
                  {generarRangoPaginas().map((item, i) => {
                    if (item === "...") {
                      return (
                        <span key={`puntos-${i}`} className="puntos-paginacion">
                          ...
                        </span>
                      );
                    } else if (item === "anterior") {
                      return (
                        <button
                          key="anterior"
                          className="boton-pagina"
                          disabled={pagina === 1 || total === 0}
                          onClick={() => pagina > 1 && setPagina(pagina - 1)}
                        >
                          ◀
                        </button>
                      );
                    } else if (item === "siguiente") {
                      return (
                        <button
                          key="siguiente"
                          className="boton-pagina"
                          disabled={pagina === totalPaginas || total === 0}
                          onClick={() =>
                            pagina < totalPaginas && setPagina(pagina + 1)
                          }
                        >
                          ▶
                        </button>
                      );
                    } else {
                      return (
                        <button
                          key={`pagina-${item}`}
                          className={`boton-pagina ${
                            pagina === item ? "activa" : ""
                          }`}
                          onClick={() => setPagina(item)}
                        >
                          {item}
                        </button>
                      );
                    }
                  })}
                </div>
                <div className="fila-paginacion-movil">
                  <button
                    className="boton-pagina"
                    disabled={pagina === 1 || total === 0}
                    onClick={() => pagina > 1 && setPagina(pagina - 1)}
                  >
                    ◀ Anterior
                  </button>
                  <button
                    className="boton-pagina"
                    disabled={pagina === totalPaginas || total === 0}
                    onClick={() =>
                      pagina < totalPaginas && setPagina(pagina + 1)
                    }
                  >
                    Siguiente ▶
                  </button>
                </div>

                {/* Texto "Mostrando..." */}
                <div className="fila-paginacion-espaciada">
                  <div className="select-por-pagina">
                    <select
                      className="select-paginacion"
                      value={porPagina}
                      onChange={(e) => {
                        setPorPagina(Number(e.target.value));
                        setPagina(1);
                      }}
                    >
                      <option value={5}>5 / página</option>
                      <option value={10}>10 / página</option>
                      <option value={20}>20 / página</option>
                      <option value={50}>50 / página</option>
                      <option value={100}>100 / página</option>
                      <option value={0}>Todos</option>
                    </select>
                  </div>
                  <div className="info-paginacion-texto">
                    {total === 0
                      ? `Mostrando 0 de 0 productos`
                      : mostrarTodo
                      ? `Mostrando todos (${total}) productos${
                          busqueda ? ` (coinciden con búsqueda: ${total})` : ""
                        }`
                      : `Mostrando ${inicio + 1} al ${Math.min(
                          inicio + porPagina,
                          total
                        )} de ${productos.length} productos${
                          busqueda ? ` (coinciden con búsqueda: ${total})` : ""
                        }`}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </MainLayout>
  );
}

export default ProductList;
