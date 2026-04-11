let finanzas = JSON.parse(localStorage.getItem("vp_finanzas")) || [];
let inventario = JSON.parse(localStorage.getItem("vp_inventario")) || [];

function showSection(id) {
    document.getElementById("seccionRecibo").style.display = "none";
    document.querySelector(".container").style.display = "block";
    document.querySelectorAll(".section").forEach(s => s.style.display = "none");
    document.getElementById(id).style.display = "block";
    renderAll();
}

function cerrarRecibo() {
    document.getElementById("seccionRecibo").style.display = "none";
    document.querySelector(".container").style.display = "block";
    showSection('finanzas');
}

function addFinanzaDirecta() {
    const desc = document.getElementById("fDesc").value;
    const monto = parseFloat(document.getElementById("fMonto").value);
    const tipo = document.getElementById("fTipo").value;
    if (!desc || isNaN(monto)) return alert("Completa los datos");
    finanzas.push({ fecha: new Date().toLocaleString(), tipo, desc, monto });
    saveAndRender();
    document.getElementById("fDesc").value = ""; document.getElementById("fMonto").value = "";
}

function addInventarioDirecto() {
    const nombre = document.getElementById("iNombre").value;
    const cant = parseInt(document.getElementById("iCant").value);
    if (!nombre || isNaN(cant)) return alert("Completa los datos");
    let lote = inventario.find(l => l.nombre.toLowerCase() === nombre.toLowerCase());
    if(lote) lote.cantidad += cant; else inventario.push({ nombre, cantidad: cant });
    saveAndRender();
    document.getElementById("iNombre").value = ""; document.getElementById("iCant").value = "";
}

function deleteFinanza(index) {
    if (confirm("¿Eliminar?")) { finanzas.splice(finanzas.length - 1 - index, 1); saveAndRender(); }
}

function editFinanza(index) {
    let mov = finanzas[finanzas.length - 1 - index];
    let nD = prompt("Descripción:", mov.desc);
    let nM = prompt("Monto:", mov.monto);
    if (nD && !isNaN(nM)) { mov.desc = nD; mov.monto = parseFloat(nM); saveAndRender(); }
}

function deleteLote(index) {
    if (confirm("¿Eliminar lote?")) { inventario.splice(index, 1); saveAndRender(); }
}

function editLote(index) {
    let lote = inventario[index];
    let nN = prompt("Nombre:", lote.nombre);
    let nC = prompt("Cantidad:", lote.cantidad);
    if (nN && !isNaN(nC)) { lote.nombre = nN; lote.cantidad = parseInt(nC); saveAndRender(); }
}

function toggleOpFields() {
    const tipo = document.querySelector('input[name="tipoOp"]:checked').value;
    document.getElementById("fieldsVenta").style.display = (tipo === "venta") ? "block" : "none";
    document.getElementById("fieldsCompra").style.display = (tipo === "compra") ? "block" : "none";
}

function procesarOperacion() {
    const tipo = document.querySelector('input[name="tipoOp"]:checked').value;
    const entidad = document.getElementById("opEntidad").value;
    const monto = parseFloat(document.getElementById("opMonto").value);
    if (!entidad || isNaN(monto)) return alert("Faltan datos");

    let detalle = "";
    if (tipo === "venta") {
        const idx = document.getElementById("selectLoteVenta").value;
        const cant = parseInt(document.getElementById("cantVenta").value);
        if (isNaN(cant) || cant > inventario[idx].cantidad) return alert("Stock insuficiente");
        inventario[idx].cantidad -= cant;
        detalle = `${cant} unid. de ${inventario[idx].nombre}`;
        finanzas.push({ fecha: new Date().toLocaleString(), tipo: "ingreso", desc: `VENTA: ${entidad} (${detalle})`, monto });
    } else {
        const nombre = document.getElementById("nombreLoteCompra").value;
        const cant = parseInt(document.getElementById("cantCompra").value);
        let lote = inventario.find(l => l.nombre.toLowerCase() === nombre.toLowerCase());
        if(lote) lote.cantidad += cant; else inventario.push({ nombre, cantidad: cant });
        detalle = `${cant} unid. de ${nombre}`;
        finanzas.push({ fecha: new Date().toLocaleString(), tipo: "gasto", desc: `COMPRA: ${entidad} (${detalle})`, monto });
    }

    saveAndRender();
    document.getElementById("printFecha").innerText = new Date().toLocaleString();
    document.getElementById("printTipo").innerText = tipo.toUpperCase();
    document.getElementById("printEntidad").innerText = entidad;
    document.getElementById("printDetalle").innerText = detalle;
    document.getElementById("printTotal").innerText = monto.toFixed(2);
    
    document.querySelector(".container").style.display = "none";
    document.getElementById("seccionRecibo").style.display = "block";
}

function saveAndRender() {
    localStorage.setItem("vp_finanzas", JSON.stringify(finanzas));
    localStorage.setItem("vp_inventario", JSON.stringify(inventario));
    renderAll();
}

function renderAll() {
    const listaF = document.getElementById("listaFinanzas");
    let total = 0; listaF.innerHTML = "";
    finanzas.slice(0).reverse().forEach((m, i) => {
        const li = document.createElement("li");
        const color = m.tipo === "ingreso" ? "ingreso" : "gasto";
        li.innerHTML = `<div style="flex-grow:1">${m.fecha} - ${m.desc}</div>
            <div class="${color}" style="margin-right:10px">${m.tipo==='ingreso'?'+':'-'} $${m.monto.toFixed(2)}</div>
            <div><button class="action-btn" onclick="editFinanza(${i})">✏️</button>
            <button class="action-btn" onclick="deleteFinanza(${i})">🗑️</button></div>`;
        listaF.appendChild(li);
        total += m.tipo === "ingreso" ? m.monto : -m.monto;
    });
    document.getElementById("balance").innerText = total.toFixed(2);
    document.getElementById("balance").className = total >= 0 ? "ingreso" : "gasto";

    const listaI = document.getElementById("listaInventario");
    const selectV = document.getElementById("selectLoteVenta");
    listaI.innerHTML = ""; selectV.innerHTML = "";
    inventario.forEach((l, i) => {
        if(l.cantidad > 0) {
            const li = document.createElement("li");
            li.innerHTML = `<div style="flex-grow:1"><b>${l.nombre}</b>: ${l.cantidad} unid.</div>
                <div><button class="action-btn" onclick="editLote(${i})">✏️</button>
                <button class="action-btn" onclick="deleteLote(${i})">🗑️</button></div>`;
            listaI.appendChild(li);
            const opt = document.createElement("option"); opt.value = i; opt.innerText = l.nombre; selectV.appendChild(opt);
        }
    });
}
renderAll();