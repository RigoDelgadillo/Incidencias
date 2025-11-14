import { router } from "expo-router";
import React from "react";
import {
  Modal,
  Pressable,
  Text
} from "react-native";
import CustomButton from "./CustomButton";

// 1. DEFINIR EL TIPO (o importarlo desde un archivo central)
interface Incidencia {
  id_incidencia: number;
  titulo: string;
  descripcion: string;
  id_estado: number;
  fecha_creacion: string;
  id_prioridad: number;
  usuarios: {
    nombre: string;
    apellido: string;
  } [] | null;
}

// 2. CORREGIR LAS PROPS
interface Props {
  visible: boolean;
  incidencia: Incidencia | null; // La incidencia puede ser 'null' al inicio
  onClose: () => void;
}

// 3. DEFINIR LA FUNCIÓN HELPER (o importarla desde 'utils')
const getEstadoTexto = (id_estado: number) => {
  switch (id_estado) {
    case 1:
      return "Nuevo";
    case 2:
      return "En proceso";
    case 3:
      return "Resuelto";
    default:
      return "Desconocido";
  }
};

// 4. RECIBIR Y USAR LAS PROPS
const IncidenciaDetalleModal = ({ visible, incidencia, onClose }: Props) => {
  
  // 5. Si no hay incidencia, no renderizamos nada.
  if (!incidencia) {
    return null;
  }

  // Si hay incidencia, renderizamos el modal
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible} // Usamos la prop 'visible'
      onRequestClose={onClose} // Usamos la prop 'onClose'
    >
      {/* Fondo oscuro semi-transparente */}
      <Pressable
        className="flex-1 justify-center items-center bg-black/50 p-4"
        onPress={onClose} // Usamos la prop 'onClose'
      >
        {/* Contenedor del contenido del modal */}
        <Pressable
          className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md"
          onPress={() => {}} // Evita que el 'press' se propague al fondo
        >
          <>
            

            {/* Usamos 'incidencia' (de las props) en lugar de 'selectedIncidencia' */}
            <Text
              className="text-3xl text-center font-Inter-Bold text-gray-800 mb-5"
              numberOfLines={3}
            >
              {incidencia.titulo}
            </Text>
            <Text
              className="text-lg text-gray-700 font-Inter-Bold"
            >Descripcion</Text>
            <Text
              className="text-lg font-Inter-Regular  mb-2"
              numberOfLines={3}
            >
              {incidencia.descripcion}
            </Text>
            <Text
              className="text-lg text-gray-700 font-Inter-Bold"
            >Creado por</Text>
            <Text className="text-lg font-Inter-Regular  mb-2">
              
              {incidencia.usuarios && incidencia.usuarios.length > 0
                ? `${incidencia.usuarios[0].nombre} ${incidencia.usuarios[0].apellido}`
                : "Usuario desconocido"}
              {/* --------------------- */}

            </Text>

            <Text className="text-lg text-gray-700 font-Inter-Bold">Fecha de Creacion</Text>
            <Text className="text-lg font-Inter-Regular  mb-2">
              {new Date(incidencia.fecha_creacion).toLocaleString("es-ES")}
            </Text>
            <Text
              className="text-lg text-gray-700 font-Inter-Bold"
            >Tecnico a cargo</Text>
            
            <CustomButton
              label="Asignar Técnico"
              color="bg-orange-400"
              textColor="text-white"
              onPress={() => {
                onClose();
                router.push("/(admin)/asignartecnico");
              }}
            />
              <CustomButton
                label="Cerrar"
                color="bg-white"
                onPress={onClose}
                textColor="text-gray-800"
                borderColor="b-slate-800 border"
              />
          </>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default IncidenciaDetalleModal;