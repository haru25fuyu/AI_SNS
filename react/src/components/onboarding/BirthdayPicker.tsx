import { useState, useEffect } from "react";

interface BirthdayPickerProps {
  onDateChange: (date: string) => void;
}

export default function BirthdayPicker({ onDateChange }: BirthdayPickerProps) {
  const today = new Date();
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");

  const years = Array.from({ length: 100 }, (_, i) => today.getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // 選択された年月から日数を計算
  const getDaysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
  const days =
    year && month
      ? Array.from(
          { length: getDaysInMonth(Number(year), Number(month)) },
          (_, i) => i + 1
        )
      : [];

  useEffect(
    () => {
      if (year && month && day) {
        // Goバックエンドが期待する YYYY-MM-DD 形式
        onDateChange(
          `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
        );
      }
    },
    [year, month, day, onDateChange]
  );

  return (
    <div className="grid grid-cols-3 gap-3">
      <select
        value={year}
        onChange={e => {
          setYear(e.target.value);
          setDay("");
        }}
        className="bg-zinc-950 border-2 border-zinc-800 rounded-2xl py-4 px-2 font-bold text-zinc-200 focus:border-emerald-500 outline-none appearance-none text-center cursor-pointer"
        style={{ colorScheme: "dark" }}
      >
        <option value="">年</option>
        {years.map(y =>
          <option key={y} value={y}>
            {y}年
          </option>
        )}
      </select>

      <select
        value={month}
        onChange={e => {
          setMonth(e.target.value);
          setDay("");
        }}
        className="bg-zinc-950 border-2 border-zinc-800 rounded-2xl py-4 px-2 font-bold text-zinc-200 focus:border-emerald-500 outline-none appearance-none text-center cursor-pointer"
        style={{ colorScheme: "dark" }}
      >
        <option value="">月</option>
        {months.map(m =>
          <option key={m} value={m}>
            {m}月
          </option>
        )}
      </select>

      <select
        value={day}
        onChange={e => setDay(e.target.value)}
        disabled={!month}
        className="bg-zinc-950 border-2 border-zinc-800 rounded-2xl py-4 px-2 font-bold text-zinc-200 focus:border-emerald-500 disabled:opacity-30 outline-none appearance-none text-center cursor-pointer"
        style={{ colorScheme: "dark" }}
      >
        <option value="">日</option>
        {days.map(d =>
          <option key={d} value={d}>
            {d}日
          </option>
        )}
      </select>
    </div>
  );
}
