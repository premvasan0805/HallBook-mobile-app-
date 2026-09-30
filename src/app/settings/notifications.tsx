import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useState } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";

import { OptionCard } from "@/components/form";
import { BottomSheet } from "@/components/overlays";
import { goBack, Screen, Touchable } from "@/components/primitives";
import { appWidth, F } from "@/lib/theme";
import { useTheme } from "@/lib/theme-context";

type Ion = ComponentProps<typeof Ionicons>["name"];

/** Laid out on an 875px-wide design reference; `u(px)` converts a reference pixel to dp. */
const REF_WIDTH = 875;

const ITEMS: { key: string; icon: Ion; title: string; sub: string }[] = [
  {
    key: "upcoming",
    icon: "calendar-outline",
    title: "Upcoming events",
    sub: "Remind me a day before each event",
  },
  {
    key: "due",
    icon: "wallet-outline",
    title: "Payment due",
    sub: "Remind me about unpaid balances",
  },
  {
    key: "tentative",
    icon: "time-outline",
    title: "Tentative holds",
    sub: "Nudge me to confirm tentative bookings",
  },
  {
    key: "daily",
    icon: "document-text-outline",
    title: "Daily summary",
    sub: "Morning digest of today's schedule",
  },
];

export default function NotificationSettingsScreen() {
  const { width } = useWindowDimensions();
  const t = useTheme();
  const u = (px: number) => (appWidth(width) / REF_WIDTH) * px;
  const [menu, setMenu] = useState(false);
  const [v, setV] = useState<Record<string, boolean>>({
    upcoming: true,
    due: true,
    tentative: true,
    daily: false,
  });
  const setAll = (on: boolean) => {
    setV(Object.fromEntries(ITEMS.map((i) => [i.key, on])));
    setMenu(false);
  };

  const header = (
    <View style={{ height: u(110) }}>
      <Touchable
        onPress={goBack}
        accessibilityLabel="Back"
        style={{
          position: "absolute",
          left: u(42),
          top: u(36),
          width: u(60),
          height: u(60),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="arrow-back" size={u(48)} color={t.C.primary} />
      </Touchable>
      {/* Title fades from blue into gold across "Notifications". */}
      <View
        accessible
        accessibilityRole="header"
        accessibilityLabel="Notifications"
        style={{ position: "absolute", left: u(131), top: u(30) }}
      >
        <Svg width={u(340)} height={u(70)} viewBox="0 0 340 70">
          <Defs>
            <LinearGradient
              id="notifTitle"
              gradientUnits="userSpaceOnUse"
              x1={95}
              y1={0}
              x2={170}
              y2={0}
            >
              <Stop offset="0" stopColor={t.C.primary} />
              <Stop offset="1" stopColor={t.C.accent} />
            </LinearGradient>
          </Defs>
          <SvgText
            x={0}
            y={53.5}
            fontFamily={F.semibold}
            fontSize={47}
            letterSpacing={-0.5}
            fill="url(#notifTitle)"
          >
            Notifications
          </SvgText>
        </Svg>
      </View>
      <Touchable
        onPress={() => setMenu(true)}
        accessibilityLabel="More actions"
        style={{
          position: "absolute",
          left: u(786),
          top: u(37),
          width: u(60),
          height: u(60),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="ellipsis-vertical" size={u(46)} color={t.C.primary} />
      </Touchable>
    </View>
  );

  return (
    <Screen
      header={header}
      contentStyle={{ paddingHorizontal: 0, paddingTop: u(14), gap: 0 }}
    >
      <Text
        style={{
          marginLeft: u(54),
          fontFamily: F.regular,
          fontSize: u(25.2),
          lineHeight: u(32),
          color: t.C.textSecondary,
        }}
      >
        Choose what reminders you want to receive
      </Text>

      <View
        style={{
          marginTop: u(38),
          marginHorizontal: u(28),
          borderRadius: u(26),
          borderWidth: 1.5,
          borderColor: t.C.border,
          backgroundColor: t.surface,
          boxShadow: `0px ${u(6)}px ${u(18)}px ${t.shadow}`,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            height: u(104),
            paddingLeft: u(26),
          }}
        >
          <View
            style={{
              width: u(66),
              height: u(66),
              borderRadius: u(33),
              backgroundColor: t.C.primarySoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="notifications-outline"
              size={u(38)}
              color={t.C.primary}
            />
          </View>
          <Text
            style={{
              marginLeft: u(24),
              fontFamily: F.semibold,
              fontSize: u(23),
              lineHeight: u(30),
              color: t.C.primary,
              letterSpacing: u(1.4),
            }}
          >
            REMINDERS
          </Text>
        </View>

        {ITEMS.map((item, i) => (
          <Touchable
            key={item.key}
            onPress={() => setV((s) => ({ ...s, [item.key]: !s[item.key] }))}
            accessibilityRole="switch"
            accessibilityState={{ checked: v[item.key] }}
            accessibilityLabel={item.title}
            style={{
              flexDirection: "row",
              alignItems: "center",
              height: u(i === ITEMS.length - 1 ? 155 : 143),
              paddingLeft: u(38),
              paddingRight: u(40),
              borderTopWidth: 1.2,
              borderTopColor: t.C.border,
            }}
          >
            <View
              style={{
                width: u(86),
                height: u(86),
                borderRadius: u(43),
                backgroundColor: t.C.primarySoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name={item.icon} size={u(44)} color={t.C.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: u(33), marginRight: u(16) }}>
              <Text
                style={{
                  fontFamily: F.semibold,
                  fontSize: u(30),
                  lineHeight: u(36),
                  color: t.C.text,
                }}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text
                style={{
                  fontFamily: F.regular,
                  fontSize: u(23.5),
                  lineHeight: u(32),
                  color: t.C.textSecondary,
                  marginTop: u(6),
                }}
                numberOfLines={1}
              >
                {item.sub}
              </Text>
            </View>
            <Toggle on={v[item.key]} u={u} />
          </Touchable>
        ))}
      </View>

      <BottomSheet
        visible={menu}
        onClose={() => setMenu(false)}
        title="Reminders"
      >
        <OptionCard
          action
          icon="notifications-outline"
          title="Turn all on"
          onPress={() => setAll(true)}
        />
        <OptionCard
          action
          icon="notifications-off-outline"
          title="Turn all off"
          onPress={() => setAll(false)}
        />
      </BottomSheet>
    </Screen>
  );
}

/** Blue track with a soft gold knob when on; grey track with a white knob when off. */
function Toggle({ on, u }: { on: boolean; u: (px: number) => number }) {
  const t = useTheme();
  return (
    <View
      style={{
        width: u(98),
        height: u(44),
        borderRadius: u(22),
        backgroundColor: on ? t.C.primary : t.C.borderStrong,
        justifyContent: "center",
      }}
    >
      <View
        style={{
          position: "absolute",
          left: on ? u(52) : u(-1),
          width: u(46),
          height: u(46),
          borderRadius: u(23),
          overflow: "hidden",
          borderWidth: on ? u(2) : 0,
          borderColor: t.C.primaryDark,
          backgroundColor: t.C.onPrimary,
          boxShadow: `0px ${u(3)}px ${u(8)}px ${t.dark ? "rgba(0, 0, 0, 0.4)" : "rgba(30, 30, 30, 0.18)"}`,
        }}
      >
        {on ? (
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 10 10"
            preserveAspectRatio="none"
          >
            <Defs>
              <LinearGradient id="knobGold" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={t.C.onPrimary} />
                <Stop offset="1" stopColor={t.C.accentOnPrimary} />
              </LinearGradient>
            </Defs>
            <Rect x={0} y={0} width={10} height={10} fill="url(#knobGold)" />
          </Svg>
        ) : null}
      </View>
    </View>
  );
}
