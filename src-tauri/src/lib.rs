use miette::IntoDiagnostic;
use std::path::PathBuf;
use usage::Spec;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn generate_cliq_json() -> miette::Result<String> {
    let mut path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    path.pop(); // 从 src-tauri 返回到项目根目录
    path.push("cliq/");
    // get the first file in cliq/ which suffixes with .kdl
    let kdl_files: Vec<_> = std::fs::read_dir(&path)
        .into_diagnostic()?
        .filter_map(|entry| {
            let entry = entry.ok()?;
            let path = entry.path();
            if path.extension()? == "kdl" {
                Some(path)
            } else {
                None
            }
        })
        .collect();
    if kdl_files.is_empty() {
        return Err(miette::miette!("No .kdl files found in cliq/ directory."));
    } else if kdl_files.len() > 1 {
        return Err(miette::miette!(
            "Multiple .kdl files found in cliq/ directory. Expected only one."
        ));
    }
    let first_kdl_file = &kdl_files[0];
    let (spec, _) = Spec::parse_file(first_kdl_file)?;
    serde_json::to_string_pretty(&spec).into_diagnostic()
}

#[tauri::command]
fn get_cliq_json() -> Result<String, String> {
    generate_cliq_json().map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, get_cliq_json])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
