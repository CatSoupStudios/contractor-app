import React, { memo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Configuration
const DOT_SIZE = 1.5;
const DOT_SPACING = 18;
const DOT_COLOR = '#A0A8B0';

// Calculate grid
const COLS = Math.ceil(SCREEN_WIDTH / DOT_SPACING) + 1;
const ROWS = Math.ceil(SCREEN_HEIGHT / DOT_SPACING) + 1;

const DotPattern = memo(() => {
    const dots = [];

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            dots.push(
                <View
                    key={`${row}-${col}`}
                    style={[
                        styles.dot,
                        {
                            left: col * DOT_SPACING,
                            top: row * DOT_SPACING,
                        }
                    ]}
                />
            );
        }
    }

    return (
        <View style={styles.container} pointerEvents="none">
            {dots}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    dot: {
        position: 'absolute',
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: DOT_SIZE / 2,
        backgroundColor: DOT_COLOR,
    },
});

export default DotPattern;
