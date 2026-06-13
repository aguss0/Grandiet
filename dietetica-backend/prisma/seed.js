// prisma/seed.js
// Ejecutar con: npx prisma db seed

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // ─── ROLES ───────────────────────────────────────────
  const rolAdmin = await prisma.rol.upsert({
    where: { nombre: "administrador" },
    update: {},
    create: { nombre: "administrador" },
  });

  const rolEmpleado = await prisma.rol.upsert({
    where: { nombre: "empleado" },
    update: {},
    create: { nombre: "empleado" },
  });

  console.log("✅ Roles creados");

  // ─── USUARIOS ────────────────────────────────────────
  const passAdmin = await bcrypt.hash("admin123", 10);
  const passEmp   = await bcrypt.hash("empleado123", 10);

  await prisma.usuario.upsert({
    where: { email: "admin@dietetica.com" },
    update: {},
    create: {
      nombre:       "María Alvarez",
      email:        "admin@dietetica.com",
      passwordHash: passAdmin,
      rolId:        rolAdmin.id,
    },
  });

  await prisma.usuario.upsert({
    where: { email: "laura@dietetica.com" },
    update: {},
    create: {
      nombre:       "Laura Méndez",
      email:        "laura@dietetica.com",
      passwordHash: passEmp,
      rolId:        rolEmpleado.id,
    },
  });

  await prisma.usuario.upsert({
    where: { email: "carlos@dietetica.com" },
    update: {},
    create: {
      nombre:       "Carlos Rodríguez",
      email:        "carlos@dietetica.com",
      passwordHash: passEmp,
      rolId:        rolEmpleado.id,
    },
  });

  console.log("✅ Usuarios creados");

  // ─── CATEGORÍAS ──────────────────────────────────────
  const categorias = [
    "Frutos secos",
    "Semillas",
    "Harinas",
    "Cereales y granos",
    "Suplementos",
    "Infusiones",
    "Aceites",
    "Endulzantes",
    "Especias",
    "Sin gluten",
  ];

  const catMap = {};
  for (const nombre of categorias) {
    const cat = await prisma.categoria.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
    catMap[nombre] = cat.id;
  }

  console.log("✅ Categorías creadas");

  // ─── PRODUCTOS ───────────────────────────────────────
  const productos = [
    {
      nombre:       "Almendras peladas 500g",
      categoriaId:  catMap["Frutos secos"],
      marca:        "NaturVida",
      descripcion:  "Almendras peladas naturales sin sal, ideal para consumo directo o repostería.",
      precioCompra: 1200,
      precioVenta:  1900,
      stockActual:  24,
      stockMinimo:  10,
      unidad:       "unidades",
    },
    {
      nombre:       "Chía orgánica 250g",
      categoriaId:  catMap["Semillas"],
      marca:        "BioFarm",
      descripcion:  "Semillas de chía orgánicas certificadas, ricas en omega-3.",
      precioCompra: 650,
      precioVenta:  1100,
      stockActual:  38,
      stockMinimo:  15,
      unidad:       "unidades",
    },
    {
      nombre:       "Harina de avena 1kg",
      categoriaId:  catMap["Harinas"],
      marca:        "Integral+",
      descripcion:  "Harina de avena molida fina, apta para dietas sin gluten.",
      precioCompra: 560,
      precioVenta:  890,
      stockActual:  19,
      stockMinimo:  10,
      unidad:       "unidades",
    },
    {
      nombre:       "Proteína whey natural 1kg",
      categoriaId:  catMap["Suplementos"],
      marca:        "ProNat",
      descripcion:  "Proteína de suero de leche sin edulcorantes artificiales.",
      precioCompra: 5200,
      precioVenta:  8400,
      stockActual:  11,
      stockMinimo:  8,
      unidad:       "unidades",
    },
    {
      nombre:       "Nueces mariposa 500g",
      categoriaId:  catMap["Frutos secos"],
      marca:        "NaturVida",
      descripcion:  "Nueces mariposa enteras, secas naturalmente.",
      precioCompra: 1800,
      precioVenta:  2800,
      stockActual:  3,
      stockMinimo:  10,
      unidad:       "unidades",
    },
    {
      nombre:       "Granola artesanal 500g",
      categoriaId:  catMap["Cereales y granos"],
      marca:        "Casera",
      descripcion:  "Granola con avena, miel, coco y frutos secos.",
      precioCompra: 750,
      precioVenta:  1350,
      stockActual:  2,
      stockMinimo:  8,
      unidad:       "unidades",
    },
    {
      nombre:       "Aceite de coco virgen 500ml",
      categoriaId:  catMap["Aceites"],
      marca:        "Orígenes",
      descripcion:  "Aceite de coco virgen extra prensado en frío.",
      precioCompra: 1650,
      precioVenta:  2600,
      stockActual:  14,
      stockMinimo:  6,
      unidad:       "unidades",
    },
    {
      nombre:       "Miel de abeja natural 500g",
      categoriaId:  catMap["Endulzantes"],
      marca:        "ColmenaSur",
      descripcion:  "Miel pura de colmenas propias, sin procesar.",
      precioCompra: 980,
      precioVenta:  1650,
      stockActual:  22,
      stockMinimo:  8,
      unidad:       "unidades",
    },
    {
      nombre:       "Cacao amargo en polvo 200g",
      categoriaId:  catMap["Especias"],
      marca:        "NaturVida",
      descripcion:  "Cacao 100% puro sin azúcar.",
      precioCompra: 580,
      precioVenta:  990,
      stockActual:  17,
      stockMinimo:  8,
      unidad:       "unidades",
    },
    {
      nombre:       "Semillas de lino 250g",
      categoriaId:  catMap["Semillas"],
      marca:        "BioFarm",
      descripcion:  "Semillas de lino marrón, fuente de fibra y omega-3.",
      precioCompra: 380,
      precioVenta:  680,
      stockActual:  5,
      stockMinimo:  15,
      unidad:       "unidades",
    },
    {
      nombre:       "Espirulina en polvo 100g",
      categoriaId:  catMap["Suplementos"],
      marca:        "ProNat",
      descripcion:  "Espirulina orgánica en polvo, rica en proteínas y vitaminas.",
      precioCompra: 1100,
      precioVenta:  1950,
      stockActual:  4,
      stockMinimo:  10,
      unidad:       "unidades",
    },
    {
      nombre:       "Mix de frutos secos 250g",
      categoriaId:  catMap["Frutos secos"],
      marca:        "NaturVida",
      descripcion:  "Mezcla de almendras, nueces, castañas y pasas.",
      precioCompra: 1100,
      precioVenta:  1850,
      stockActual:  20,
      stockMinimo:  10,
      unidad:       "unidades",
    },
  ];

  for (const p of productos) {
    await prisma.producto.create({ data: p });
  }

  console.log("✅ Productos creados");
  console.log("\n🎉 Seed completado exitosamente");
  console.log("─────────────────────────────────────");
  console.log("Credenciales de acceso:");
  console.log("  Admin:    admin@dietetica.com / admin123");
  console.log("  Empleado: laura@dietetica.com / empleado123");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
