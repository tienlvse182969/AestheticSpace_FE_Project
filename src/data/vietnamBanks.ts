export interface VietnamBank {
  code: string;
  shortName: string;
  fullName: string;
}

export const VIETNAM_BANKS: VietnamBank[] = [
  { code: "VCB",  shortName: "Vietcombank",   fullName: "Ngân hàng TMCP Ngoại Thương Việt Nam" },
  { code: "CTG",  shortName: "VietinBank",    fullName: "Ngân hàng TMCP Công Thương Việt Nam" },
  { code: "BIDV", shortName: "BIDV",          fullName: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam" },
  { code: "VBA",  shortName: "Agribank",      fullName: "Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam" },
  { code: "TCB",  shortName: "Techcombank",   fullName: "Ngân hàng TMCP Kỹ Thương Việt Nam" },
  { code: "MBB",  shortName: "MB Bank",       fullName: "Ngân hàng TMCP Quân Đội" },
  { code: "ACB",  shortName: "ACB",           fullName: "Ngân hàng TMCP Á Châu" },
  { code: "VPB",  shortName: "VPBank",        fullName: "Ngân hàng TMCP Việt Nam Thịnh Vượng" },
  { code: "TPB",  shortName: "TPBank",        fullName: "Ngân hàng TMCP Tiên Phong" },
  { code: "STB",  shortName: "Sacombank",     fullName: "Ngân hàng TMCP Sài Gòn Thương Tín" },
  { code: "HDB",  shortName: "HDBank",        fullName: "Ngân hàng TMCP Phát triển TP.HCM" },
  { code: "SHB",  shortName: "SHB",           fullName: "Ngân hàng TMCP Sài Gòn - Hà Nội" },
  { code: "OCB",  shortName: "OCB",           fullName: "Ngân hàng TMCP Phương Đông" },
  { code: "MSB",  shortName: "MSB",           fullName: "Ngân hàng TMCP Hàng Hải Việt Nam" },
  { code: "SSB",  shortName: "SeABank",       fullName: "Ngân hàng TMCP Đông Nam Á" },
  { code: "VIB",  shortName: "VIB",           fullName: "Ngân hàng TMCP Quốc Tế Việt Nam" },
  { code: "EIB",  shortName: "Eximbank",      fullName: "Ngân hàng TMCP Xuất Nhập Khẩu Việt Nam" },
  { code: "LPB",  shortName: "LPBank",        fullName: "Ngân hàng TMCP Lộc Phát Việt Nam" },
  { code: "NAB",  shortName: "Nam A Bank",    fullName: "Ngân hàng TMCP Nam Á" },
  { code: "PVB",  shortName: "PVcomBank",     fullName: "Ngân hàng TMCP Đại Chúng Việt Nam" },
  { code: "BAB",  shortName: "Bac A Bank",    fullName: "Ngân hàng TMCP Bắc Á" },
  { code: "ABB",  shortName: "ABBANK",        fullName: "Ngân hàng TMCP An Bình" },
  { code: "KLB",  shortName: "KienlongBank",  fullName: "Ngân hàng TMCP Kiên Long" },
  { code: "NVB",  shortName: "NCB",           fullName: "Ngân hàng TMCP Quốc Dân" },
  { code: "SGB",  shortName: "SaigonBank",    fullName: "Ngân hàng TMCP Sài Gòn Công Thương" },
  { code: "BVB",  shortName: "BaoVietBank",   fullName: "Ngân hàng TMCP Bảo Việt" },
  { code: "VBB",  shortName: "VietBank",      fullName: "Ngân hàng TMCP Việt Nam Thương Tín" },
  { code: "PGB",  shortName: "PGBank",        fullName: "Ngân hàng TMCP Xăng dầu Petrolimex" },
  { code: "VCCB", shortName: "BVBank",        fullName: "Ngân hàng TMCP Bản Việt" },
  { code: "GPB",  shortName: "GPBank",        fullName: "Ngân hàng Thương mại TNHH MTV Dầu Khí Toàn Cầu" },
  { code: "OJB",  shortName: "OceanBank",     fullName: "Ngân hàng Thương mại TNHH MTV Đại Dương" },
  { code: "CBB",  shortName: "CBBank",        fullName: "Ngân hàng Thương mại TNHH MTV Xây dựng Việt Nam" },
  { code: "DAB",  shortName: "DongA Bank",    fullName: "Ngân hàng TMCP Đông Á" },
  { code: "SCB",  shortName: "SCB",           fullName: "Ngân hàng TMCP Sài Gòn" },
  { code: "VRB",  shortName: "VRB",           fullName: "Ngân hàng Liên doanh Việt - Nga" },
  { code: "COOP", shortName: "Co-opBank",     fullName: "Ngân hàng Hợp tác xã Việt Nam" },
  { code: "SCVN", shortName: "Standard Chartered", fullName: "Ngân hàng Standard Chartered Việt Nam" },
  { code: "HSBC", shortName: "HSBC",          fullName: "Ngân hàng HSBC Việt Nam" },
  { code: "ANZ",  shortName: "ANZ",           fullName: "Ngân hàng ANZ Việt Nam" },
  { code: "SHBVN",shortName: "Shinhan Bank",  fullName: "Ngân hàng Shinhan Việt Nam" },
  { code: "WVN",  shortName: "Woori Bank",    fullName: "Ngân hàng Woori Việt Nam" },
  { code: "CIMB", shortName: "CIMB",          fullName: "Ngân hàng CIMB Việt Nam" },
  { code: "UOB",  shortName: "UOB",           fullName: "Ngân hàng UOB Việt Nam" },
  { code: "PBVN", shortName: "Public Bank",   fullName: "Ngân hàng Public Bank Việt Nam" },
  { code: "IVB",  shortName: "Indovina Bank", fullName: "Ngân hàng Indovina" },
];

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export function searchVietnamBanks(query: string): VietnamBank[] {
  const q = normalize(query.trim());
  if (!q) return VIETNAM_BANKS;
  return VIETNAM_BANKS.filter(
    b =>
      normalize(b.code).includes(q) ||
      normalize(b.shortName).includes(q) ||
      normalize(b.fullName).includes(q)
  );
}
