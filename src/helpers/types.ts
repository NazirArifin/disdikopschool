// export interface PoolConfig {
//   host: string;
//   port: number;
//   user: string;
//   password: string;
//   database: string;
//   multipleStatements: boolean;
//   connectionLimit: number;
//   bigIntAsNumber: boolean;
// }

export type SdkConfigType = {
  instpath: string;
  ipmac: string;
  portmac: string;
  snmac: string;
  passwordmac: string;
  numbermac: string;
  activationmac: string;
  iphost: string;
  porthost: string;
}

export interface FPType {
  id?: number;
  ip: string;
  keyCom: string;
  port: string;
  active: boolean;
}

export interface PegawaiType {
  id?: number;
  pin: string;
  nip: string;
  nama: string;
  namaSingkat: string;
  active: boolean;
}

export interface SyncType {
  id?: number;
  date: string;
  count: number;
}

export type Logs = {
  pin: string; 
  name: string; 
  alias: string; 
  dateTime: string;
}

export type Shift = {
  tanggal: string;
  libur: boolean;
  shift: {
    scanIn: string;
    scanOut: string;
    scanInEnd: string;
    scanOutEnd: string;
  };
}

export type AjuanIjin = {
  id: number; 
  sekolah: string; 
  pegawai: string; 
  jenis: string; 
  alasan: string; 
  keterangan: string; 
  tanggal: string[]|string;
}