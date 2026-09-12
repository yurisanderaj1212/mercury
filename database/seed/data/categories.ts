/**
 * Árbol de categorías iniciales para Mercury MVP.
 * Refleja los productos más comunes en el mercado cubano.
 */

export interface CategorySeed {
  name: string;
  description: string;
  slug: string;
  children?: CategorySeed[];
}

export const INITIAL_CATEGORIES: CategorySeed[] = [
  {
    name: 'Alimentos y Bebidas',
    description: 'Productos alimenticios, bebidas y artículos de cocina',
    slug: 'alimentos-bebidas',
    children: [
      { name: 'Aceites y Grasas', description: 'Aceites vegetales, manteca y similares', slug: 'aceites-grasas' },
      { name: 'Arroz y Granos', description: 'Arroz, frijoles, lentejas y otros granos', slug: 'arroz-granos' },
      { name: 'Carnes y Embutidos', description: 'Carnes frescas, pollo, cerdo y embutidos', slug: 'carnes-embutidos' },
      { name: 'Lácteos y Huevos', description: 'Leche, queso, yogur y huevos', slug: 'lacteos-huevos' },
      { name: 'Bebidas', description: 'Refrescos, jugos, agua y bebidas alcohólicas', slug: 'bebidas' },
      { name: 'Condimentos y Especias', description: 'Sal, azúcar, vinagre y especias', slug: 'condimentos-especias' },
    ],
  },
  {
    name: 'Electrodomésticos',
    description: 'Equipos del hogar y electrodomésticos',
    slug: 'electrodomesticos',
    children: [
      { name: 'Refrigeradores', description: 'Neveras y refrigeradores', slug: 'refrigeradores' },
      { name: 'Lavadoras', description: 'Lavadoras y secadoras', slug: 'lavadoras' },
      { name: 'Cocinas y Hornos', description: 'Cocinas de gas, eléctricas y hornos', slug: 'cocinas-hornos' },
      { name: 'Ventiladores y Climatización', description: 'Ventiladores, aires acondicionados y climatizadores', slug: 'ventiladores-climatizacion' },
      { name: 'Televisores', description: 'Televisores y equipos de sonido', slug: 'televisores' },
    ],
  },
  {
    name: 'Tecnología',
    description: 'Equipos electrónicos, celulares y accesorios',
    slug: 'tecnologia',
    children: [
      { name: 'Celulares y Smartphones', description: 'Teléfonos móviles y accesorios', slug: 'celulares-smartphones' },
      { name: 'Computadoras', description: 'Laptops, desktops y tabletas', slug: 'computadoras' },
      { name: 'Accesorios Electrónicos', description: 'Cables, cargadores, auriculares', slug: 'accesorios-electronicos' },
    ],
  },
  {
    name: 'Ropa y Calzado',
    description: 'Prendas de vestir, calzado y accesorios de moda',
    slug: 'ropa-calzado',
    children: [
      { name: 'Ropa de Hombre', description: 'Camisas, pantalones y ropa masculina', slug: 'ropa-hombre' },
      { name: 'Ropa de Mujer', description: 'Vestidos, blusas y ropa femenina', slug: 'ropa-mujer' },
      { name: 'Ropa de Niño', description: 'Ropa infantil y juvenil', slug: 'ropa-nino' },
      { name: 'Calzado', description: 'Zapatos, tenis y sandalias', slug: 'calzado' },
    ],
  },
  {
    name: 'Hogar y Muebles',
    description: 'Muebles, decoración y artículos del hogar',
    slug: 'hogar-muebles',
    children: [
      { name: 'Muebles de Sala', description: 'Sofás, sillones y muebles de sala', slug: 'muebles-sala' },
      { name: 'Muebles de Dormitorio', description: 'Camas, colchones y armarios', slug: 'muebles-dormitorio' },
      { name: 'Artículos de Cocina', description: 'Utensilios, vajillas y accesorios de cocina', slug: 'articulos-cocina' },
      { name: 'Materiales de Construcción', description: 'Cemento, pintura, materiales de construcción', slug: 'materiales-construccion' },
    ],
  },
  {
    name: 'Vehículos',
    description: 'Autos, motos, bicicletas y repuestos',
    slug: 'vehiculos',
    children: [
      { name: 'Automóviles', description: 'Carros y camionetas', slug: 'automoviles' },
      { name: 'Motos y Bicicletas', description: 'Motocicletas y bicicletas', slug: 'motos-bicicletas' },
      { name: 'Repuestos y Accesorios', description: 'Piezas y accesorios para vehículos', slug: 'repuestos-accesorios' },
    ],
  },
  {
    name: 'Salud y Cuidado Personal',
    description: 'Medicamentos, cosméticos y artículos de higiene',
    slug: 'salud-cuidado-personal',
    children: [
      { name: 'Medicamentos', description: 'Medicamentos y suplementos', slug: 'medicamentos' },
      { name: 'Higiene Personal', description: 'Jabones, champús y productos de higiene', slug: 'higiene-personal' },
      { name: 'Cosméticos y Belleza', description: 'Maquillaje, perfumes y cuidado de la piel', slug: 'cosmeticos-belleza' },
    ],
  },
  {
    name: 'Servicios',
    description: 'Servicios profesionales y ofertas de trabajo',
    slug: 'servicios',
    children: [
      { name: 'Servicios del Hogar', description: 'Plomería, electricidad, carpintería', slug: 'servicios-hogar' },
      { name: 'Servicios Profesionales', description: 'Clases, asesorías y servicios varios', slug: 'servicios-profesionales' },
    ],
  },
];
