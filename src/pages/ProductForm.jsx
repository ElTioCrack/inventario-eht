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
    precio: 0,
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
          fotoUrl: reader.result,
        }));
        setNombreArchivo(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const borrarImagen = () => {
    setFormData((prev) => ({ ...prev, fotoUrl: "" }));
    setNombreArchivo("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const camposFaltantes = [];
    if (!formData.nombre.trim()) camposFaltantes.push("Nombre");
    if (!formData.categoriaId.trim()) camposFaltantes.push("Categoría");
    if (!formData.cantidad.trim()) camposFaltantes.push("Cantidad");
    if (!formData.precio || isNaN(formData.precio))
      camposFaltantes.push("Precio");

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
      precio: parseFloat(formData.precio),
      fotoUrl: formData.fotoUrl || "",
      fechaCreacion: id ? formData.fechaCreacion || timestamp : timestamp,
      ultimaEdicion: id ? timestamp || "" : "",
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
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
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

            <div className="form-group">
              <label>Cantidad:</label>
              <input
                type="text"
                name="cantidad"
                value={formData.cantidad}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Precio (Bs):</label>
              <input
                type="number"
                name="precio"
                step="0.01"
                value={formData.precio}
                onChange={handleChange}
                required
              />
            </div>
          </div>

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
                disabled={!formData.fotoUrl}
                onClick={borrarImagen}
              >
                ❌ Quitar Imagen
              </button>
            </div>

            {nombreArchivo && (
              <p className="nombre-archivo">📎 {nombreArchivo}</p>
            )}

            <div className="imagen-preview">
              <img
                src={formData.fotoUrl || "/assets/default_image.png"}
                alt="Vista previa"
              />
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
