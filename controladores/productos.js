const Producto = require('../database/productos');

exports.getProductos = async(req,res,next) => {
    try{
        const {categoria} = req.query;
        let filtro = {};
        if(categoria){
            filtro.categoria = categoria
        }
        const productos = await Producto.find(filtro)
        res.status(200).json(productos);
        console.log('Exito al cargar productos')
    }catch(error){
        next(error);
    }
};

exports.createProducto = async(req,res,next) => {
    try{
        const {nombre, precio, descripcion, stock, categoria, imagenUrl} = req.body;
        const imagenFinal = imagenUrl || 'default.avif';
        const nuevoProducto = new Producto({
            nombre,
            precio,
            descripcion,
            stock,
            categoria,
            imagen : imagenFinal
        });
        await nuevoProducto.save();
        res.status(201).json({message: 'Producto creado con exito', producto: nuevoProducto});
        console.log('Producto creado con exito', nuevoProducto);
    }catch(error){
        next(error);
        console.error(error)
    }
};

exports.deleteProducto = async (req,res,next) => {
    try{
        const {id} = req.params;
        const productDelete = await Producto.findByIdAndDelete(id);
        if(!productDelete){
            return res.status(404).json({message: 'El producto no existe'});
        }
        res.status(200).json({message: 'Producto eliminado correctamente'});
        console.log(`Producto con id ${id} eliminado correctamente`)
    } catch(error){
        next(error);
        console.error(error)
    }
};

exports.updateProducto = async (req,res,next) => {
    try{
        const {id} = req.params;
        const datosaActualizar = req.body;
        const productoActualizado = await Producto.findByIdAndUpdate(id, datosaActualizar, {new:true});
        if(!productoActualizado){
            return res.status(404).json({message: 'Ese producto no existe'});
        }
        res.status(200).json({message: 'Producto editado con exito', producto: productoActualizado});
        console.log(`Producto con id ${id} actualizado con exito`)
    } catch(error){
        next(error);
        console.error(error);
    }
}
