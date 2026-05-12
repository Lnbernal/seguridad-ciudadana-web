export interface Report {

    id_reporte?: number;

    titulo: string;

    descripcion: string;

    direccion: string;

    latitud?: number;

    longitud?: number;

    id_categoria: number;

    id_usuario: number;

    id_estado?: number;

}