import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, Text, View } from "react-native";

import { supabase } from "@/utils/supabase";

// Tipos de datos crudos de la BD
type AsignacionRaw = {
  id_asignacion: number;
  id_incidencia: number;
  id_administrador: string; // uuid
  id_tecnico: string;       // uuid
};

type Usuario = {
  id_usuario: string;
  nombre: string;
  apellido: string;
};

type Incidencia = {
  id_incidencia: number;
  titulo: string;
};

// Tipo ya "bonito" para mostrar
type AsignacionVista = {
  id_asignacion: number;
  incidenciaTitulo: string;
  tecnicoNombre: string;
  adminNombre: string;
};

export default function ListaAsignaciones() {
  const [asignaciones, setAsignaciones] = useState<AsignacionVista[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarAsignaciones();
  }, []);

  async function cargarAsignaciones() {
    try {
      setLoading(true);

      // Pedimos TODO lo necesario en paralelo:
      const [
        { data: asignData, error: asignError },
        { data: usuariosData, error: usuariosError },
        { data: incidenciasData, error: incidenciasError },
      ] = await Promise.all([
        supabase
          .from("asignaciones")
          .select("id_asignacion, id_incidencia, id_administrador, id_tecnico"),
        supabase
          .from("usuarios")
          .select("id_usuario, nombre, apellido"),
        supabase
          .from("incidencias")
          .select("id_incidencia, titulo"),
      ]);

      if (asignError) throw asignError;
      if (usuariosError) throw usuariosError;
      if (incidenciasError) throw incidenciasError;

      const asignacionesRaw: AsignacionRaw[] = asignData ?? [];
      const usuarios: Usuario[] = usuariosData ?? [];
      const incidencias: Incidencia[] = incidenciasData ?? [];

      // Crear mapas para buscar rápido por id
      const mapaUsuarios = new Map<string, string>();
      usuarios.forEach((u) => {
        mapaUsuarios.set(u.id_usuario, `${u.nombre} ${u.apellido}`);
      });

      const mapaIncidencias = new Map<number, string>();
      incidencias.forEach((i) => {
        mapaIncidencias.set(i.id_incidencia, i.titulo);
      });

      // Convertir a formato listo para la vista
      const asignacionesVista: AsignacionVista[] = asignacionesRaw.map((a) => ({
        id_asignacion: a.id_asignacion,
        incidenciaTitulo:
          mapaIncidencias.get(a.id_incidencia) ??
          `Incidencia #${a.id_incidencia}`,
        tecnicoNombre:
          mapaUsuarios.get(a.id_tecnico) ?? "Técnico desconocido",
        adminNombre:
          mapaUsuarios.get(a.id_administrador) ?? "Admin desconocido",
      }));

      setAsignaciones(asignacionesVista);
    } catch (err) {
      console.error("Error cargando asignaciones:", err);
      Alert.alert("Error", "No se pudieron cargar las asignaciones.");
    } finally {
      setLoading(false);
    }
  }

  const renderAsignacion = ({ item }: { item: AsignacionVista }) => (
    <View className="mb-3 rounded-xl border border-gray-300 bg-white p-3">
      <Text className="text-xs text-gray-500">
        ID asignación: {item.id_asignacion}
      </Text>

      <Text className="mt-1 font-Inter-Bold">
        Incidencia: {item.incidenciaTitulo}
      </Text>

      <Text className="mt-1 text-sm text-gray-700">
        Técnico: <Text className="font-Inter-Bold">{item.tecnicoNombre}</Text>
      </Text>

      <Text className="text-sm text-gray-700">
        Administrador:{" "}
        <Text className="font-Inter-Bold">{item.adminNombre}</Text>
      </Text>
    </View>
  );

  return (
    <View className="mx-auto mt-10 w-[380px]">
      {/* Header */}
      <View className="mb-4 flex-row items-center justify-between">
        <Link href="/(auth)/login">
          <Text className="text-2xl">←</Text>
        </Link>
        <Text className="text-xl font-Inter-Bold">
          Asignaciones de técnicos
        </Text>
      </View>

      {/* Texto de estado */}
      {loading && (
        <Text className="mb-2 text-sm text-gray-500">
          Cargando asignaciones...
        </Text>
      )}

      {!loading && asignaciones.length === 0 && (
        <Text className="mt-4 text-center text-gray-500">
          No hay asignaciones registradas.
        </Text>
      )}

      {/* Lista */}
      <FlatList
        data={asignaciones}
        renderItem={renderAsignacion}
        keyExtractor={(item) => item.id_asignacion.toString()}
        style={{ maxHeight: 500 }}
      />
    </View>
  );
}

