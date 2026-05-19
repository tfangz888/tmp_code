use std::env;
use std::fs::File;
use std::io::{self, Read, Write};
use std::path::Path;

/// 输入记录结构（32字节）
///
/// 二进制格式:
/// date      : int32
/// o         : int32
/// h         : int32
/// l         : int32
/// c         : int32
/// amount    : float32
/// volume    : int32
/// reserved  : int32
#[derive(Debug, Clone)]
struct InRecord {
    date: i32,
    o: i32,
    h: i32,
    l: i32,
    c: i32,
    amount: f32,
    volume: i32,
    _reserved: i32,
}

/// 输出记录结构（28字节）
///
/// 输出格式:
/// date      : int32
/// o         : float32
/// h         : float32
/// l         : float32
/// c         : float32
/// volume    : int32
/// amount    : float32
#[derive(Debug)]
struct OutRecord {
    date: i32,
    o: f32,
    h: f32,
    l: f32,
    c: f32,
    volume: i32,
    amount: f32,
}

fn read_i32(buf: &[u8], pos: usize) -> i32 {
    i32::from_le_bytes(buf[pos..pos + 4].try_into().unwrap())
}

fn read_f32(buf: &[u8], pos: usize) -> f32 {
    f32::from_le_bytes(buf[pos..pos + 4].try_into().unwrap())
}

fn print_help(program: &str) {
    println!(
        r#"splitdaily - split and convert daily binary data

Usage:
  {0} <input_file> <YYYYMM>

Example:
  {0} daily.bin 202601

Input Record Format (32 bytes):
  date      int32
  o         int32
  h         int32
  l         int32
  c         int32
  amount    float32
  volume    int32
  reserved  int32

Processing:
  1. Read binary records
  2. Filter only specified month
  3. Sort by date ascending
  4. Remove duplicated date records
  5. Convert OHLC from int32 to float32 and divide by 100.0
  6. Drop reserved field
  7. Write output file

Output Record Format (28 bytes):
  date      int32
  o         float32
  h         float32
  l         float32
  c         float32
  volume    int32
  amount    float32

Output File:
  input.bin  -> input.202601
"#,
        program
    );
}

fn main() -> io::Result<()> {
    let args: Vec<String> = env::args().collect();

    // help
    if args.len() != 3
        || args[1] == "-h"
        || args[1] == "--help"
    {
        print_help(&args[0]);
        std::process::exit(0);
    }

    let input_file = &args[1];
    let month = &args[2];

    // 检查 YYYYMM
    if month.len() != 6 || !month.chars().all(|c| c.is_ascii_digit()) {
        eprintln!("ERROR: invalid month format: {}", month);
        eprintln!("expected format: YYYYMM");
        std::process::exit(1);
    }

    println!("Input file : {}", input_file);
    println!("Target month: {}", month);

    // 202601 -> 20260101 ~ 20260131
    let month_start: i32 = format!("{}01", month).parse().unwrap();
    let month_end: i32 = format!("{}31", month).parse().unwrap();

    println!(
        "Date range : {} ~ {}",
        month_start, month_end
    );

    // 读取整个文件
    let mut data = Vec::new();
    File::open(input_file)?.read_to_end(&mut data)?;

    println!("Input size : {} bytes", data.len());

    // 输入记录固定32字节
    let record_size = 32;

    if data.len() % record_size != 0 {
        eprintln!(
            "WARNING: file size is not multiple of {} bytes",
            record_size
        );
    }

    let total_records = data.len() / record_size;

    println!("Total records in file: {}", total_records);

    let mut records = Vec::new();

    // 解析二进制记录
    for chunk in data.chunks_exact(record_size) {
        let rec = InRecord {
            date: read_i32(chunk, 0),
            o: read_i32(chunk, 4),
            h: read_i32(chunk, 8),
            l: read_i32(chunk, 12),
            c: read_i32(chunk, 16),
            amount: read_f32(chunk, 20),
            volume: read_i32(chunk, 24),
            _reserved: read_i32(chunk, 28),
        };

        // 只保留目标月份
        if rec.date >= month_start && rec.date <= month_end {
            records.push(rec);
        }
    }

    println!(
        "Records after month filter: {}",
        records.len()
    );

    // 按日期排序
    records.sort_by_key(|r| r.date);

    let before_dedup = records.len();

    // 去掉重复日期
    // 保留排序后的第一条
    records.dedup_by_key(|r| r.date);

    let removed = before_dedup - records.len();

    println!(
        "Duplicated dates removed: {}",
        removed
    );

    println!(
        "Final output records: {}",
        records.len()
    );

    // 输出文件:
    // aaa.bin -> aaa.202601
    let output_file = {
        let path = Path::new(input_file);
        let stem = path.with_extension("");
        format!("{}.{}", stem.to_string_lossy(), month)
    };

    println!("Output file: {}", output_file);

    let mut out = File::create(&output_file)?;

    // 写输出
    for r in records {
        let orec = OutRecord {
            date: r.date,
            o: r.o as f32 / 100.0,
            h: r.h as f32 / 100.0,
            l: r.l as f32 / 100.0,
            c: r.c as f32 / 100.0,
            volume: r.volume,
            amount: r.amount,
        };

        out.write_all(&orec.date.to_le_bytes())?;
        out.write_all(&orec.o.to_le_bytes())?;
        out.write_all(&orec.h.to_le_bytes())?;
        out.write_all(&orec.l.to_le_bytes())?;
        out.write_all(&orec.c.to_le_bytes())?;
        out.write_all(&orec.volume.to_le_bytes())?;
        out.write_all(&orec.amount.to_le_bytes())?;
    }

    println!("Done.");
    Ok(())
}
