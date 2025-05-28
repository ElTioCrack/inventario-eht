import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, get, set } from "firebase/database";
import { db } from "../firebase/config";
import MainLayout from "../components/MainLayout";
import "../styles/ProductForm.css";

function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: "",
    categoriaId: "",
    categoriaNombre: "",
    cantidad: "",
    precio: "",
    fotoUrl: "",
  });

  const [categorias, setCategorias] = useState([]);
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const catRef = ref(db, "categorias");
    get(catRef).then((snap) => {
      if (snap.exists()) {
        const obj = snap.val();
        const lista = Object.entries(obj).map(([key, val]) => ({
          id: key,
          ...val,
        }));
        setCategorias(lista);
      }
    });
  }, []);

  useEffect(() => {
    if (id) {
      const prodRef = ref(db, `productos/${id}`);
      get(prodRef).then((snap) => {
        if (snap.exists()) {
          const data = snap.val();
          setFormData(data);
          setNombreArchivo(data.fotoUrl ? "Imagen cargada" : "");
        }
      });
    }
  }, [id]);

  useEffect(() => {
    const ajustarAltura = () => {
      const nombre = document.querySelector("textarea[name='nombre']");
      const cantidad = document.querySelector("textarea[name='cantidad']");
      const precio = document.querySelector("textarea[name='precio']");

      if (nombre) {
        nombre.style.height = "auto";
        nombre.style.height = `${nombre.scrollHeight}px`;
      }

      if (cantidad && precio) {
        cantidad.style.height = "auto";
        precio.style.height = "auto";
        const alturaMax = Math.max(cantidad.scrollHeight, precio.scrollHeight);
        cantidad.style.height = `${alturaMax}px`;
        precio.style.height = `${alturaMax}px`;
      }
    };

    ajustarAltura();

    const handler = () => ajustarAltura();

    const nombre = document.querySelector("textarea[name='nombre']");
    const cantidad = document.querySelector("textarea[name='cantidad']");
    const precio = document.querySelector("textarea[name='precio']");

    nombre?.addEventListener("input", handler);
    cantidad?.addEventListener("input", handler);
    precio?.addEventListener("input", handler);

    return () => {
      nombre?.removeEventListener("input", handler);
      cantidad?.removeEventListener("input", handler);
      precio?.removeEventListener("input", handler);
    };
  }, [formData.nombre, formData.cantidad, formData.precio]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoriaChange = (e) => {
    const selectedId = e.target.value;
    const cat = categorias.find((c) => c.id === selectedId);
    setFormData((prev) => ({
      ...prev,
      categoriaId: selectedId,
      categoriaNombre: cat?.nombre || "",
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({
          ...prev,
          imagenBase64: reader.result,
        }));
        setNombreArchivo(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const borrarImagen = () => {
    setFormData((prev) => ({
      ...prev,
      imagenBase64: "",
    }));
    setNombreArchivo("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const camposFaltantes = [];
    if (!formData.nombre.trim()) camposFaltantes.push("Nombre");
    if (!formData.categoriaId.trim()) camposFaltantes.push("Categoría");
    if (!formData.cantidad.trim()) camposFaltantes.push("Cantidad");
    if (!formData.precio.trim()) camposFaltantes.push("Precio");

    if (camposFaltantes.length > 0) {
      alert(
        `Debes completar todos los campos:\n- ${camposFaltantes.join("\n- ")}`
      );
      return;
    }

    setGuardando(true);

    const timestamp = new Date().toISOString();
    const productoId = id || crypto.randomUUID();
    const productoRef = ref(db, `productos/${productoId}`);

    const productoData = {
      nombre: formData.nombre.trim(),
      categoriaId: formData.categoriaId.trim(),
      categoriaNombre: formData.categoriaNombre.trim(),
      cantidad: formData.cantidad.trim(),
      precio: formData.precio.trim(),
      imagenBase64: formData.imagenBase64 || "",
      urlImagen: "",
      fechaCreacion: id ? formData.fechaCreacion || timestamp : timestamp,
      ultimaEdicion: id ? timestamp : "",
    };

    try {
      await set(productoRef, productoData);
      alert("✅ Producto guardado correctamente.");
      navigate("/");
    } catch (error) {
      alert("❌ Ocurrió un error al guardar el producto.");
      console.error(error);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <MainLayout>
      <h2 className="subtitulo-productos centrado-horizontal">
        {id ? "Editar Producto" : "Registrar Producto"}
      </h2>
      <form
        className="formulario-producto-doble-columna"
        autoComplete="off"
        onSubmit={handleSubmit}
      >
        <div>
          <div className="columna-formulario">
            <div className="form-group">
              <label>Nombre:</label>
              <textarea
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                rows={2}
                required
              ></textarea>
            </div>

            <div className="form-group">
              <label>Categoría:</label>
              <select
                name="categoriaId"
                value={formData.categoriaId}
                onChange={handleCategoriaChange}
                required
              >
                <option value="" disabled>
                  -- Selecciona categoría --
                </option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="fila-cantidad-precio">
              <div className="form-group precio-col">
                <label>Precio (Bs):</label>
                <textarea
                  name="precio"
                  value={formData.precio}
                  onChange={handleChange}
                  rows={4}
                  required
                ></textarea>
              </div>
              <div className="form-group cantidad-col">
                <label>Cantidad:</label>
                <textarea
                  name="cantidad"
                  value={formData.cantidad}
                  onChange={handleChange}
                  rows={4}
                  required
                ></textarea>
              </div>
            </div>
          </div>
          <hr className="linea-moviles" />
          <div className="columna-imagen">
            <div className="grupo-file-row">
              <label className="custom-file">
                <span className="btn-upload">📤 Cargar Imagen</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </label>
              <button
                type="button"
                className="btn-borrar-imagen-inline"
                disabled={
                  !formData.fotoUrl &&
                  !formData.urlImagen &&
                  (!formData.imagenBase64 ||
                    formData.imagenBase64.trim() === "")
                }
                onClick={borrarImagen}
              >
                ❌ Quitar Imagen
              </button>
            </div>

            {/* {nombreArchivo && (
              <p className="nombre-archivo">📎 {nombreArchivo}</p>
            )} */}

            <div className="polaroid-wrapper">
              <div className="polaroid-frame">
                <img
                  src={
                    formData.imagenBase64
                      ? formData.imagenBase64.startsWith("data:image")
                        ? formData.imagenBase64
                        : `data:image/png;base64,${formData.imagenBase64}`
                      : "/assets/default_image.png"
                  }
                  alt="Vista previa"
                  className="polaroid-image"
                  onError={(e) => {
                    if (!e.target.dataset.fallback) {
                      e.target.dataset.fallback = true;
                      e.target.src = "/assets/default_image.png";
                    }
                  }}
                />

                <div className="polaroid-caption">
                  {nombreArchivo || "Imagen de producto"}
                </div>
              </div>
            </div>
          </div>
        </div>
        <hr className="linea-final" />
        <div className="fila-botones">
          <button
            type="submit"
            className="btn-formulario btn-guardar"
            disabled={guardando}
          >
            {guardando ? "Guardando..." : id ? "Actualizar" : "Registrar"}
          </button>
          <button
            type="button"
            className="btn-formulario btn-cancelar"
            onClick={() => navigate("/")}
          >
            Cancelar
          </button>
        </div>
      </form>
    </MainLayout>
  );
}

export default ProductForm;
