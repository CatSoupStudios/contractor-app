import { StyleSheet } from 'react-native';

export const getStyles = (COLORS: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center'
    },
    iconContainer: {
        marginBottom: 24,
        backgroundColor: COLORS.surface,
        padding: 20,
        borderRadius: 50
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 12
    },
    description: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24
    },
    loaderContainer: {
        alignItems: 'center',
        marginBottom: 20,
        height: 60
    },
    loadingText: {
        color: COLORS.primary,
        marginTop: 10,
        fontWeight: '600'
    },
    logoutButton: {
        marginTop: 10
    },
    logoutText: {
        color: COLORS.error || '#ef4444',
        textDecorationLine: 'underline'
    },
    continueButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
    },
    continueText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold'
    },
    resendButton: {
        backgroundColor: COLORS.surface,
        padding: 12,
        borderRadius: 8,
        marginBottom: 20
    },
    resendText: {
        color: COLORS.text,
        fontWeight: '600'
    }
});
