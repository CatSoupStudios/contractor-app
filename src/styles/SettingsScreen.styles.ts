import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' }, // Fondo oscuro

    // Header simple para modal
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    closeButton: { padding: 5 },
    closeText: { color: '#3b82f6', fontSize: 16, fontWeight: '600' },

    content: { flex: 1, padding: 20 },

    // Títulos de secciones
    sectionTitle: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 10,
        marginLeft: 4,
    },

    // Contenedor de grupos (Cajas redondeadas)
    section: {
        backgroundColor: '#1e293b', // Color Slate-800
        borderRadius: 12,
        marginBottom: 24,
        overflow: 'hidden',
    },
    separator: { height: 1, backgroundColor: '#334155', marginLeft: 50 },

    // Items individuales
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    itemLeft: { flexDirection: 'row', alignItems: 'center' },

    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    itemText: { fontSize: 16, color: '#fff', fontWeight: '500' },

    // Estilos destructivos (Log Out)
    destructiveIconBox: { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
    destructiveText: { color: '#ef4444' },

    versionText: {
        textAlign: 'center',
        color: '#475569',
        fontSize: 13,
        marginBottom: 40,
    }
});
