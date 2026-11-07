import type { LaneStat } from "@/lib/odds";

/** Duo versus duo, all ranks, same window as dataWindow, at least 30 lane matchups. Streets are pooled. Solo lanes are excluded by the source table. */
export const laneMatchups: LaneStat[] = [
  {a:13,b:15,c:10,d:72,wins:25,matches:37},
  {a:10,b:72,c:13,d:15,wins:12,matches:37},
  {a:7,b:84,c:64,d:72,wins:16,matches:35},
  {a:64,b:72,c:7,d:84,wins:19,matches:35},
  {a:10,b:64,c:13,d:27,wins:11,matches:34},
  {a:13,b:27,c:10,d:64,wins:23,matches:34},
  {a:64,b:72,c:6,d:7,wins:15,matches:33},
  {a:64,b:72,c:65,d:84,wins:19,matches:33},
  {a:13,b:84,c:15,d:64,wins:23,matches:33},
  {a:15,b:64,c:13,d:84,wins:10,matches:33},
  {a:65,b:84,c:64,d:72,wins:14,matches:33},
  {a:63,b:84,c:15,d:64,wins:19,matches:33},
  {a:15,b:64,c:63,d:84,wins:14,matches:33},
  {a:6,b:7,c:64,d:72,wins:18,matches:33},
  {a:1,b:64,c:11,d:63,wins:13,matches:32},
  {a:11,b:63,c:1,d:64,wins:19,matches:32},
  {a:13,b:64,c:2,d:6,wins:12,matches:31},
  {a:31,b:65,c:15,d:64,wins:18,matches:31},
  {a:64,b:72,c:76,d:84,wins:10,matches:31},
  {a:76,b:84,c:64,d:72,wins:21,matches:31},
  {a:15,b:64,c:31,d:65,wins:13,matches:31},
  {a:2,b:6,c:13,d:64,wins:19,matches:31},
  {a:64,b:72,c:7,d:19,wins:18,matches:30},
  {a:7,b:19,c:64,d:72,wins:12,matches:30}
];
