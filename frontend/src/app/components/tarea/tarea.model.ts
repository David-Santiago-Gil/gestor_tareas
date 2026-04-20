export interface tarea {
    id: string,
    idUsuario: number,
    titulo: string,
    resumen: string,
    expira: string,
    completada?: number,
    imagenFondo?: string,
}

export interface NuevaTareaInfo {
    titulo: string;
    resumen: string;
    fecha: string;
    imagenFondo?: string;
}