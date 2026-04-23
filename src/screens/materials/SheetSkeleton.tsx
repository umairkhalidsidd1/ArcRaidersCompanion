import React from 'react';
import {StyleSheet, View} from 'react-native';
import {borderRadius, spacing} from '../../theme/theme';
import {wbStyles} from './styles';

const Bone = ({style}: {style?: any}) => <View style={[styles.bone, style]} />;

const SheetSkeleton = () => (
  <>
    {[0, 1].map(section => (
      <View key={section} style={styles.sectionWrap}>
        <View style={styles.headerRow}>
          <Bone style={styles.headerBar} />
          <Bone style={styles.headerCheckbox} />
          <Bone style={[styles.headerTitle, {width: section === 0 ? 136 : 154}]} />
          <Bone style={styles.headerLine} />
        </View>

        {[0, 1, 2].map(row => (
          <View key={`${section}-${row}`} style={[wbStyles.matCard, styles.rowCard]}>
            <View style={wbStyles.matIconWrap}>
              <Bone style={styles.iconBone} />
            </View>

            <View style={wbStyles.matInfo}>
              <Bone style={[styles.nameBone, {width: row === 1 ? 122 : 170}]} />
              <Bone style={[styles.descBone, {width: row === 2 ? 148 : 186}]} />
            </View>

            <Bone style={styles.qtyBone} />
          </View>
        ))}
      </View>
    ))}
  </>
);

const styles = StyleSheet.create({
  sectionWrap: {
    marginBottom: spacing.xl,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerBar: {
    width: 3,
    height: 26,
    marginRight: spacing.sm,
    borderRadius: 1.5,
  },
  headerCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  headerTitle: {
    height: 18,
    borderRadius: 6,
  },
  headerLine: {
    flex: 1,
    height: 2,
    borderRadius: 2,
    marginLeft: spacing.md,
  },
  rowCard: {
    overflow: 'hidden',
  },
  iconBone: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  nameBone: {
    height: 13,
    borderRadius: 5,
    marginBottom: 8,
  },
  descBone: {
    height: 10,
    borderRadius: 5,
  },
  qtyBone: {
    width: 42,
    height: 26,
    borderRadius: borderRadius.md,
  },
  bone: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});

export default React.memo(SheetSkeleton);