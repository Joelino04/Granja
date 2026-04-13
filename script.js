import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAghdsuFbejExRSF3sjxxWXb2t6yKjo-pE",
    authDomain: "granjavallejovillamarin.firebaseapp.com",
    projectId: "granjavallejovillamarin",
    storageBucket: "granjavallejovillamarin.firebasestorage.app",
    messagingSenderId: "167338569968",
    appId: "1:167338569968:web:17a8e0b3f3d4f632465235",
    databaseURL: "https://granjavallejovillamarin-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let finanzas = [];
let inventario = [];

onValue(ref(db, 'granja/'), (snapshot) => {
    const data = snapshot.val();
    if (data) {
        finanzas = data.finanzas || [];
        inventario = data.inventario || [];
        renderAll();
    }
});

function syncToCloud() {
    set(ref(db, 'granja/'), { finanzas, inventario });
}

window.showSection = (id) => {
    document.getElementById("seccionRecibo").style.display = "none";
    document.querySelector(".container").style.display = "block";
    document.querySelectorAll(".section").forEach(s => s.style.display = "none");
    document.getElementById(id).style.display = "block";
};

window.cerrarRecibo = () => window.showSection('finanzas');

window.addFinanzaDirecta = () => {
    const fechaInput = document.getElementById("fFecha").value;
    const desc = document.getElementById("fDesc").value;
    const monto = parseFloat(document.getElementById("fMonto").value);
    const tipo = document.getElementById("fTipo").value;
    const fechaFinal = fechaInput || new Date().toLocaleDateString();

    if (!desc || isNaN(monto)) return alert("Completa concepto y monto");
    finanzas.push({ fecha: fechaFinal, tipo, desc, monto });
    syncToCloud();
    document.getElementById("fDesc").value = ""; document.getElementById("fMonto").value = "";
};

window.addInventarioDirecto = () => {
    const nombre = document.getElementById("iNombre").value;
    const cant = parseInt(document.getElementById("iCant").value);
    if (!nombre || isNaN(cant)) return alert("Faltan datos");
    let lote = inventario.find(l => l.nombre.toLowerCase() === nombre.toLowerCase());
    if(lote) lote.cantidad += cant; else inventario.push({ nombre, cantidad: cant });
    syncToCloud();
    document.getElementById("iNombre").value = ""; document.getElementById("iCant").value = "";
};

window.deleteFinanza = (index) => {
    if (confirm("¿Eliminar registro?")) { finanzas.splice(finanzas.length - 1 - index, 1); syncToCloud(); }
};

window.editFinanza = (index) => {
    let mov = finanzas[finanzas.length - 1 - index];
    let nD = prompt("Concepto:", mov.desc);
    let nM = prompt("Monto:", mov.monto);
    if (nD && !isNaN(nM)) { mov.desc = nD; mov.monto = parseFloat(nM); syncToCloud(); }
};

window.deleteLote = (index) => {
    if (confirm("¿Eliminar lote?")) { inventario.splice(index, 1); syncToCloud(); }
};

window.editLote = (index) => {
    let lote = inventario[index];
    let nN = prompt("Nombre:", lote.nombre);
    let nC = prompt("Cantidad:", lote.cantidad);
    if (nN && !isNaN(nC)) { lote.nombre = nN; lote.cantidad = parseInt(nC); syncToCloud(); }
};

window.toggleOpFields = () => {
    const tipo = document.querySelector('input[name="tipoOp"]:checked').value;
    document.getElementById("fieldsVenta").style.display = (tipo === "venta") ? "block" : "none";
    document.getElementById("fieldsCompra").style.display = (tipo === "compra") ? "block" : "none";
};

window.procesarOperacion = () => {
    const tipo = document.querySelector('input[name="tipoOp"]:checked').value;
    const entidad = document.getElementById("opEntidad").value;
    const monto = parseFloat(document.getElementById("opMonto").value);
    if (!entidad || isNaN(monto)) return alert("Datos incompletos");
    let detalle = "";
    if (tipo === "venta") {
        const idx = document.getElementById("selectLoteVenta").value;
        const cant = parseInt(document.getElementById("cantVenta").value);
        if (isNaN(cant) || !inventario[idx] || cant > inventario[idx].cantidad) return alert("Error en cantidad o lote");
        inventario[idx].cantidad -= cant;
        detalle = `${cant} cerdos de ${inventario[idx].nombre}`;
        finanzas.push({ fecha: new Date().toLocaleDateString(), tipo: "ingreso", desc: `VENTA: ${entidad} (${detalle})`, monto });
    } else {
        const nombre = document.getElementById("nombreLoteCompra").value;
        const cant = parseInt(document.getElementById("cantCompra").value);
        let lote = inventario.find(l => l.nombre.toLowerCase() === nombre.toLowerCase());
        if(lote) lote.cantidad += cant; else inventario.push({ nombre, cantidad: cant });
        detalle = `${cant} cerdos para ${nombre}`;
        finanzas.push({ fecha: new Date().toLocaleDateString(), tipo: "gasto", desc: `COMPRA: ${entidad} (${detalle})`, monto });
    }
    syncToCloud();
    document.getElementById("printFecha").innerText = new Date().toLocaleString();
    document.getElementById("printTipo").innerText = tipo.toUpperCase();
    document.getElementById("printEntidad").innerText = entidad;
    document.getElementById("printDetalle").innerText = detalle;
    document.getElementById("printTotal").innerText = monto.toFixed(2);
    document.querySelector(".container").style.display = "none";
    document.getElementById("seccionRecibo").style.display = "block";
};

function renderAll() {
    const listaF = document.getElementById("listaFinanzas");
    let total = 0; 
    if(listaF) {
        listaF.innerHTML = "";
        finanzas.slice(0).reverse().forEach((m, i) => {
            const li = document.createElement("li");
            const color = m.tipo === "ingreso" ? "ingreso" : "gasto";
            li.innerHTML = `<div style="line-height:1.2"><small style="color:#999">${m.fecha}</small><br>${m.desc}</div>
                <div style="display:flex; align-items:center;"><span class="${color}">${m.tipo==='ingreso'?'+':'-'}$${m.monto.toFixed(2)}</span>
                <button class="action-btn" onclick="editFinanza(${i})">✏️</button>
                <button class="action-btn" onclick="deleteFinanza(${i})">🗑️</button></div>`;
            listaF.appendChild(li);
            total += m.tipo === "ingreso" ? m.monto : -m.monto;
        });
        document.getElementById("balance").innerText = total.toLocaleString();
    }
    const listaI = document.getElementById("listaInventario");
    const selectV = document.getElementById("selectLoteVenta");
    if(listaI) {
        listaI.innerHTML = ""; if(selectV) selectV.innerHTML = "";
        inventario.forEach((l, i) => {
            if(l.cantidad > 0) {
                const li = document.createElement("li");
                li.innerHTML = `<div><b>${l.nombre}</b><br><small>${l.cantidad} animales</small></div>
                    <div><button class="action-btn" onclick="editLote(${i})">✏️</button>
                    <button class="action-btn" onclick="deleteLote(${i})">🗑️</button></div>`;
                listaI.appendChild(li);
                const opt = document.createElement("option"); opt.value = i; opt.innerText = l.nombre; if(selectV) selectV.appendChild(opt);
            }
        });
    }
}