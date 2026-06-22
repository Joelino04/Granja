// Variables globales del sistema
let finanzas = [];
let inventario = [];
let filtroActivo = 'todos'; 
let intervalConsejos = null; // Control del temporizador de 20 segundos

const listaRecordatorios = [
    "Sustitución Local: Recuerda que sustituir hasta un 20% del balanceado comercial con yuca o verde de la zona alivia el costo del lote sin perder calidad en la carne.",
    "Humedad del Insumo: Si usan yuca o verde picado, aseguren que esté fresco; el alimento húmedo guardado por más de 24 horas puede fermentarse y enfermar a los animales.",
    "Flete Compartido: Planificar las compras de balanceado comercial en lotes grandes junto con otros productores de Puyo para menorar el costo del transporte por saco.",
    "Almacenamiento Seco: Mantener los sacos sobre palets de madera y alejados de las paredes para evitar que la humedad de la Amazonía dañe el producto.",
    "Control de Desperdicio: Revisar diariamente que los cerdos no estén botando o desparramando el balanceado fuera de los comederos; grano en el piso es dinero perdido.",
    "Fugas en Bebederos: Una rosca floja o un chupón goteando desperdicia miles de litros de agua y destruye prematuramente el piso de cemento del corral.",
    "Hacinamiento Visual: Monitorear el espacio; si un corral supera el límite de 8 cerdos, el estrés reduce la velocidad de engorde y aumenta el gasto en medicina.",
    "Limpieza con Presión: Realizar la limpieza de los corrales temprano en la mañana; retirar el estiércol seco primero ahorra hasta un 30% de agua durante el lavado.",
    "Desinfección entre Lotes: Cuando un corral quede vacío, desinfectar a fondo con cal viva antes de meter el nuevo lote para cortar de raíz cualquier bacteria.",
    "Pendiente del Piso: Verificar que los desagües no se tapen; el agua estancada genera hongos en las pezuñas y futuros gastos veterinarios.",
    "Calendario Riguroso: Es más barato prevenir que curar. Un lechón desparasitado y vacunado a tiempo asimila el doble de alimento.",
    "Aislamiento Temprano: Si ven un animal triste o que no quiere comer, apartarlo de inmediato al corral de cuarentena para evitar contagios masivos.",
    "Higiene en las Visitas: Evitar que personas ajenas a la granja entren directamente a los corrales sin desinfectarse las botas; los virus viajan en los zapatos.",
    "Control de Peso Visual: Aunque no haya balanza, si un lechón se queda muy atrás del promedio del lote, necesita revisión nutricional o desparasitante extra.",
    "Suplementación Estratégica: El uso de melaza local en el agua aporta energía rápida y económica en las semanas de mayor frío o lluvia.",
    "Mantenimiento Preventivo: Revisar los amarres de las mallas y las puertas antes de que se rompan del todo; una soldadura a tiempo cuesta la mitad que una reparación de emergencia.",
    "Herramientas en su Sitio: Guardar palas, escobas y baldes en un lugar techado; dejarlos al sol y a la lluvia de Pastaza duplica el gasto en reponer materiales.",
    "Planificación de Faena: Coordinar las ventas con los asaderos locales con 2 semanas de anticipación para evitar mantener cerdos listos de más de 4 meses comiendo balanceado en vano.",
    "Anotación Inmediata: Si se hace un gasto imprevisto, anótenlo en la caja al instante; los 'gastos hormiga' sueltos alteran el balance total a fin de mes."
];

// ==========================================
// 1. CONFIGURACIÓN E INICIALIZACIÓN CLÁSICA
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyAghdsuFbejExRSF3sjxxWXb2t6yKjo-pE",
    authDomain: "granjavallejovillamarin.firebaseapp.com",
    projectId: "granjavallejovillamarin",
    storageBucket: "granjavallejovillamarin.firebasestorage.app",
    messagingSenderId: "167338569968",
    appId: "1:167338569968:web:17a8e0b3f3d4f632465235",
    databaseURL: "https://granjavallejovillamarin-default-rtdb.firebaseio.com/"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Rotación automática de consejos
function rotarConsejo() {
    const el = document.getElementById("textoConsejo");
    if (!el) return;
    el.style.opacity = 0;
    setTimeout(() => {
        const aleatorio = Math.floor(Math.random() * listaRecordatorios.length);
        el.innerText = listaRecordatorios[aleatorio];
        el.style.opacity = 1;
    }, 300);
}

// ==========================================
// 2. CONTROL DE FILTROS
// ==========================================
window.setFiltro = (tipo) => {
    filtroActivo = tipo;
    renderAll();
};

// ==========================================
// 3. EXPORTAR REPORTE A EXCEL
// ==========================================
window.exportarExcel = () => {
    try {
        if (finanzas.length === 0) return alert("No hay movimientos registrados para exportar.");
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        csvContent += "Fecha;Tipo;Concepto / Descripcion;Monto ($)\n";
        finanzas.forEach(m => {
            if(!m) return;
            let descLimpia = m.desc.replace(/;/g, ',');
            csvContent += `${m.fecha};${m.tipo.toUpperCase()};${descLimpia};${m.monto}\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Reporte_Finanzas_Granja_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) { alert("Error al generar el reporte."); }
};

// ==========================================
// 4. FUNCIONES DE NAVEGACIÓN Y FORMULARIOS
// ==========================================
window.showSection = (id) => {
    try {
        if (document.getElementById("seccionRecibo")) document.getElementById("seccionRecibo").style.display = "none";
        if (document.querySelector(".container")) document.querySelector(".container").style.display = "block";
        
        document.querySelectorAll(".section").forEach(s => s.style.display = "none");
        const target = document.getElementById(id);
        if (target) target.style.display = "block";

        clearInterval(intervalConsejos);
        if (id === 'reportes') {
            rotarConsejo();
            intervalConsejos = setInterval(rotarConsejo, 20000);
        }
    } catch (e) { console.error(e); }
};

window.cerrarRecibo = () => window.showSection('finanzas');

window.addFinanzaDirecta = () => {
    try {
        const fechaInput = document.getElementById("fFecha").value;
        const desc = document.getElementById("fDesc").value;
        const monto = parseFloat(document.getElementById("fMonto").value);
        const tipo = document.getElementById("fTipo").value;
        const fechaFinal = fechaInput || new Date().toLocaleDateString();

        if (!desc || isNaN(monto)) return alert("Completa concepto y monto");
        
        finanzas.push({ fecha: fechaFinal, tipo: tipo, desc: desc, monto: monto });
        syncToCloud();
        
        document.getElementById("fDesc").value = ""; 
        document.getElementById("fMonto").value = "";
    } catch (e) { console.error(e); }
};

window.addInventarioDirecto = () => {
    try {
        const nombre = document.getElementById("iNombre").value;
        const cant = parseInt(document.getElementById("iCant").value);
        const fechaInput = document.getElementById("iFecha").value;
        if (!nombre || isNaN(cant)) return alert("Faltan datos");
        
        let lote = inventario.find(l => l.nombre.toLowerCase() === nombre.toLowerCase());
        if(lote) {
            lote.cantidad = (parseInt(lote.cantidad) || 0) + cant; 
            if(fechaInput) lote.fechaIngreso = fechaInput;
        } else {
            const fechaFinal = fechaInput || new Date().toISOString().split('T')[0];
            inventario.push({ nombre: nombre, cantidad: cant, fechaIngreso: fechaFinal });
        }
        syncToCloud();
        
        document.getElementById("iNombre").value = ""; 
        document.getElementById("iCant").value = "";
        document.getElementById("iFecha").value = "";
    } catch (e) { console.error(e); }
};

window.deleteFinanza = (absoluteIndex) => {
    if (confirm("¿Eliminar registro financiero definitivo?")) { 
        finanzas.splice(absoluteIndex, 1); 
        syncToCloud(); 
    }
};

window.editFinanza = (absoluteIndex) => {
    let mov = finanzas[absoluteIndex];
    if (!mov) return;
    let nD = prompt("Concepto:", mov.desc);
    let nM = prompt("Monto:", mov.monto);
    if (nD && !isNaN(nM)) { 
        mov.desc = nD; 
        mov.monto = parseFloat(nM); 
        syncToCloud(); 
    }
};

window.deleteLote = (index) => {
    if (confirm("¿Eliminar lote?")) { inventario.splice(index, 1); syncToCloud(); }
};

window.editLote = (index) => {
    let lote = inventario[index];
    if (!lote) return;
    let nN = prompt("Nombre del Lote:", lote.nombre);
    let nC = prompt("Cantidad de Animales:", lote.cantidad);
    let nF = prompt("Fecha de ingreso (AAAA-MM-DD):", lote.fechaIngreso || "");
    if (nN && !isNaN(nC)) { 
        lote.nombre = nN; 
        lote.cantidad = parseInt(nC);
        if(nF) lote.fechaIngreso = nF;
        syncToCloud(); 
    }
};

window.toggleOpFields = () => {
    const tipoEl = document.querySelector('input[name="tipoOp"]:checked');
    if (!tipoEl) return;
    const tipo = tipoEl.value;
    if (document.getElementById("fieldsVenta")) document.getElementById("fieldsVenta").style.display = (tipo === "venta") ? "block" : "none";
    if (document.getElementById("fieldsCompra")) document.getElementById("fieldsCompra").style.display = (tipo === "compra") ? "block" : "none";
};

window.procesarOperacion = () => {
    try {
        const tipoEl = document.querySelector('input[name="tipoOp"]:checked');
        if (!tipoEl) return alert("Selecciona tipo de operación");
        const tipo = tipoEl.value;
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
            finanzas.push({ fecha: new Date().toLocaleDateString(), tipo: "ingreso", desc: `VENTA: ${entidad} (${detalle})`, monto: monto });
        } else {
            const nombre = document.getElementById("nombreLoteCompra").value;
            const cant = parseInt(document.getElementById("cantCompra").value);
            
            let lote = inventario.find(l => l.nombre.toLowerCase() === nombre.toLowerCase());
            if(lote) lote.cantidad += cant; else inventario.push({ nombre: nombre, cantidad: cant, fechaIngreso: new Date().toISOString().split('T')[0] });
            
            detalle = `${cant} cerdos para ${nombre}`;
            finanzas.push({ fecha: new Date().toLocaleDateString(), tipo: "gasto", desc: `COMPRA: ${entidad} (${detalle})`, monto: monto });
        }
        syncToCloud();
        
        if(document.getElementById("printFecha")) document.getElementById("printFecha").innerText = new Date().toLocaleString();
        if(document.getElementById("printTipo")) document.getElementById("printTipo").innerText = tipo.toUpperCase();
        if(document.getElementById("printEntidad")) document.getElementById("printEntidad").innerText = entidad;
        if(document.getElementById("printDetalle")) document.getElementById("printDetalle").innerText = detalle;
        if(document.getElementById("printTotal")) document.getElementById("printTotal").innerText = monto.toFixed(2);
        
        if (document.querySelector(".container")) document.querySelector(".container").style.display = "none";
        if (document.getElementById("seccionRecibo")) document.getElementById("seccionRecibo").style.display = "block";
    } catch (e) { console.error(e); }
};

function syncToCloud() {
    db.ref('granja/').set({ finanzas: finanzas, inventario: inventario });
}

// ==========================================
// 5. RENDERING E INTELIGENCIA DE NEGOCIO
// ==========================================
function renderAll() {
    try {
        const listaF = document.getElementById("listaFinanzas");
        let total = 0; 
        let totalIngresos = 0;
        let totalGastos = 0;

        finanzas.forEach((m) => {
            if(!m) return;
            const montoVal = Number(m.monto) || 0;
            if (m.tipo === "ingreso") {
                totalIngresos += montoVal;
                total += montoVal;
            } else {
                totalGastos += montoVal;
                total -= montoVal;
            }
        });

        ['todos', 'ingreso', 'gasto'].forEach(t => {
            const btn = document.getElementById(`btnFiltro_${t}`);
            if (btn) {
                btn.style.background = (t === filtroActivo) ? 'var(--primary)' : 'white';
                btn.style.color = (t === filtroActivo) ? 'white' : '#333';
            }
        });

        if(listaF) {
            listaF.innerHTML = "";
            const busqueda = document.getElementById("buscarFinanza") ? document.getElementById("buscarFinanza").value.toLowerCase() : "";
            const finanzasMapeadas = finanzas.map((m, originalIdx) => ({ ...m, originalIdx }));
            const finanzasFiltradas = finanzasMapeadas.filter(m => {
                if(!m) return false;
                const cumpleTipo = (filtroActivo === 'todos' || m.tipo === filtroActivo);
                const cumpleBusqueda = m.desc.toLowerCase().includes(busqueda);
                return cumpleTipo && cumpleBusqueda;
            });

            finanzasFiltradas.reverse().forEach((m) => {
                const li = document.createElement("li");
                const color = m.tipo === "ingreso" ? "ingreso" : "gasto";
                const montoVal = Number(m.monto) || 0;
                
                li.innerHTML = `<div style="line-height:1.2"><small style="color:#999">${m.fecha}</small><br>${m.desc}</div>
                    <div style="display:flex; align-items:center;"><span class="${color}">${m.tipo==='ingreso'?'+':'-'}$${montoVal.toFixed(2)}</span>
                    <button class="action-btn" onclick="editFinanza(${m.originalIdx})">✏️</button>
                    <button class="action-btn" onclick="deleteFinanza(${m.originalIdx})">🗑️</button></div>`;
                listaF.appendChild(li);
            });
            
            if(document.getElementById("balance")) document.getElementById("balance").innerText = total.toLocaleString();
        }

        const listaI = document.getElementById("listaInventario");
        const selectV = document.getElementById("selectLoteVenta");
        let totalCerdos = 0;

        if(listaI) {
            listaI.innerHTML = ""; 
            if(selectV) selectV.innerHTML = "";
            
            inventario.forEach((l, i) => {
                if(!l) return;
                const numCerdos = parseInt(l.cantidad) || 0;
                if(numCerdos > 0) {
                    totalCerdos += numCerdos;
                    const li = document.createElement("li");
                    
                    let textoFecha = "";
                    if (l.fechaIngreso) {
                        const fIngreso = new Date(l.fechaIngreso);
                        const fActual = new Date();
                        const diffTime = fActual - fIngreso;
                        const diasPasados = Math.floor(diffTime / (1000 * 60 * 60 * 24)) || 0;
                        const diasRestantes = 120 - diasPasados;
                        
                        if (diasRestantes > 0) {
                            textoFecha = `<br><small style="color: #0288d1; font-weight: 500;">⏳ Lote en día ${diasPasados}/120 (Faltan ${diasRestantes} días para faena)</small>`;
                        } else {
                            textoFecha = `<br><small style="color: #e74c3c; font-weight: bold;">🚀 ¡Ciclo Cumplido! Lote listo para el mercado</small>`;
                        }
                    }

                    let porcentaje = Math.min((numCerdos / 8) * 100, 100);
                    let colorBarra = porcentaje >= 100 ? '#e74c3c' : '#2e7d32'; 
                    
                    li.innerHTML = `<div style="width: 70%;">
                        <b>${l.nombre}</b>${textoFecha}<br>
                        <div style="width: 100%; background: #e0e0e0; border-radius: 10px; margin-top: 6px; height: 8px; overflow: hidden;">
                            <div style="width: ${porcentaje}%; background: ${colorBarra}; height: 100%; border-radius: 10px;"></div>
                        </div>
                        <small style="color:#666">${numCerdos} / 8 animales (Capacidad)</small>
                    </div>
                    <div><button class="action-btn" onclick="editLote(${i})">✏️</button>
                    <button class="action-btn" onclick="deleteLote(${i})">🗑️</button></div>`;
                    
                    listaI.appendChild(li);
                    
                    const opt = document.createElement("option"); opt.value = i; opt.innerText = l.nombre; 
                    if(selectV) selectV.appendChild(opt);
                }
            });
        }

        if(document.getElementById("dashIngresos")) document.getElementById("dashIngresos").innerText = `$${totalIngresos.toLocaleString()}`;
        if(document.getElementById("dashGastos")) document.getElementById("dashGastos").innerText = `$${totalGastos.toLocaleString()}`;
        if(document.getElementById("dashCerdos")) document.getElementById("dashCerdos").innerText = `${totalCerdos} u.`;
        
        let proyeccionDinero = totalCerdos * 250; 
        if(document.getElementById("dashProyeccion")) document.getElementById("dashProyeccion").innerText = `$${proyeccionDinero.toLocaleString()}`;

        // --- 5D. ANÁLISIS DE GASTOS, SEMÁFORO Y TOP 3 ---
        let catAlimento = 0;
        let catSalud = 0;
        let catInfra = 0;
        let catOtros = 0;
        let listaGastosPuros = [];

        finanzas.forEach((m) => {
            if (!m || m.tipo !== "gasto") return;
            const desc = m.desc.toLowerCase();
            const montoVal = Number(m.monto) || 0;

            listaGastosPuros.push(m);

            if (desc.includes("alimento") || desc.includes("balanceado") || desc.includes("comida") || desc.includes("yuca") || desc.includes("verde")) {
                catAlimento += montoVal;
            } else if (desc.includes("medicina") || desc.includes("vacuna") || desc.includes("purgar") || desc.includes("salud") || desc.includes("veterinario")) {
                catSalud += montoVal;
            } else if (desc.includes("corral") || desc.includes("malla") || desc.includes("infraestructura") || desc.includes("construccion") || desc.includes("bloque") || desc.includes("cemento")) {
                catInfra += montoVal;
            } else {
                catOtros += montoVal;
            }
        });

        if(document.getElementById("txtAlimento")) document.getElementById("txtAlimento").innerText = `$${catAlimento.toFixed(2)}`;
        if(document.getElementById("txtSalud")) document.getElementById("txtSalud").innerText = `$${catSalud.toFixed(2)}`;
        if(document.getElementById("txtInfra")) document.getElementById("txtInfra").innerText = `$${catInfra.toFixed(2)}`;
        if(document.getElementById("txtOtros")) document.getElementById("txtOtros").innerText = `$${catOtros.toFixed(2)}`;

        const gastoMaximo = Math.max(catAlimento, catSalud, catInfra, catOtros, 1);
        if(document.getElementById("barAlimento")) document.getElementById("barAlimento").style.width = `${(catAlimento / gastoMaximo) * 100}%`;
        if(document.getElementById("barSalud")) document.getElementById("barSalud").style.width = `${(catSalud / gastoMaximo) * 100}%`;
        if(document.getElementById("barInfra")) document.getElementById("barInfra").style.width = `${(catInfra / gastoMaximo) * 100}%`;
        if(document.getElementById("barOtros")) document.getElementById("barOtros").style.width = `${(catOtros / gastoMaximo) * 100}%`;

        if(document.getElementById("alertAlimentoPorCerdo")) {
            let costoPorCerdo = totalCerdos > 0 ? (catAlimento / totalCerdos) : 0;
            document.getElementById("alertAlimentoPorCerdo").innerText = `$${costoPorCerdo.toFixed(2)}`;
        }
        
        if(document.getElementById("alertMayorGasto")) {
            let mayorNombre = "Ninguno";
            let maxValor = Math.max(catAlimento, catSalud, catInfra, catOtros);
            if(maxValor > 0) {
                if(maxValor === catAlimento) mayorNombre = "🌾 Alimento";
                else if(maxValor === catSalud) mayorNombre = "💊 Medicina";
                else if(maxValor === catInfra) mayorNombre = "🔨 Infraest.";
                else mayorNombre = "🚚 Varios";
            }
            document.getElementById("alertMayorGasto").innerText = mayorNombre;
        }

        if(document.getElementById("alertMetaAhorro")) {
            let ahorroPotencial = catAlimento * 0.20;
            document.getElementById("alertMetaAhorro").innerText = `$${ahorroPotencial.toFixed(2)}`;
        }

        const listaTopUI = document.getElementById("listaTopGastos");
        if(listaTopUI) {
            listaTopUI.innerHTML = "";
            let top3 = listaGastosPuros.sort((a, b) => b.monto - a.monto).slice(0, 3);
            if(top3.length === 0) {
                listaTopUI.innerHTML = `<li style='color:#999; font-size:13px; justify-content:center;'>No hay gastos registrados.</li>`;
            } else {
                top3.forEach(g => {
                    const li = document.createElement("li");
                    li.style.fontSize = "13px";
                    li.style.padding = "10px 15px";
                    li.innerHTML = `<span><b>${g.fecha}</b> - ${g.desc}</span><span style='color:#e74c3c; font-weight:bold;'>$${Number(g.monto).toFixed(2)}</span>`;
                    listaTopUI.appendChild(li);
                });
            }
        }

    } catch (error) { console.error("Error en renderizado general:", error); }
}

// ==========================================
// 6. ESCUCHA ACTIVA DESDE FIREBASE
// ==========================================
db.ref('granja/').on('value', (snapshot) => {
    const data = snapshot.val();
    finanzas = (data && data.finanzas) ? data.finanzas : [];
    inventario = (data && data.inventario) ? data.inventario : [];
    renderAll();
});
