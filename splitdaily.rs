use std::env;
use std::fs::File;
use std::io::{self, Read, Write};
use std::path::Path;

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

fn main() -> io::Result<()> {
    let args: Vec<String> = env::args().collect();

    if args.len() != 3 {
        eprintln!("Usage: {} input_file YYYYMM", args[0]);
        std::process::exit(1);
    }

    let input_file = &args[1];
    let month = &args[2];

    if month.len() != 6 {
        eprintln!("month must be like 202601");
        std::process::exit(1);
    }

    let month_start: i32 = format!("{}01", month).parse().unwrap();
    let month_end: i32 = format!("{}31", month).parse().unwrap();

    let mut data = Vec::new();
    File::open(input_file)?.read_to_end(&mut data)?;

    let record_size = 32;

    if data.len() % record_size != 0 {
        eprintln!("Warning: file size is not multiple of 32 bytes");
    }

    let mut records = Vec::new();

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

        if rec.date >= month_start && rec.date <= month_end {
            records.push(rec);
        }
    }

    records.sort_by_key(|r| r.date);
    records.dedup_by_key(|r| r.date);

    let output_file = {
        let path = Path::new(input_file);
        let stem = path.with_extension("");
        format!("{}.{}", stem.to_string_lossy(), month)
    };

    let mut out = File::create(&output_file)?;

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

    println!("written: {}", output_file);
    Ok(())
}
