import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../../design/theme";

/**
 * One block of the Explore page: its own card with a title, and a row inside it that scrolls
 * sideways on its own.
 */
export default function ExploreSection({
  title,
  icon,
  note,
  action,
  filters,
  snap,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  note?: string;
  /** Something tappable at the end of the header, such as "See all". */
  action?: React.ReactNode;
  /** Rows of filter chips between the header and the scrolling row. */
  filters?: React.ReactNode;
  /** Width of one item plus the gap, so a swipe settles on a whole item. */
  snap?: number;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.block}>
      <View style={styles.head}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {note && <Text style={styles.note}>{note}</Text>}
        {action}
      </View>
      {filters}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={snap}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={styles.row}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 14,
    paddingVertical: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF0EA",
  },
  title: { flex: 1, fontFamily: "InterSemi", fontSize: 18, color: colors.ink },
  note: { fontFamily: "Inter", fontSize: 13, color: colors.muted },
  row: { paddingHorizontal: 16, gap: 12 },
});
