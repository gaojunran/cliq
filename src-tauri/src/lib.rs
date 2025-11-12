use miette::IntoDiagnostic;
use std::path::PathBuf;
use usage::Spec;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn generate_cliq_json() -> miette::Result<String> {
    // base is the parent of CARGO_MANIFEST_DIR (project root)
    let mut base = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    base.pop(); // 从 src-tauri 返回到项目根目录，base 指向项目根

    // 搜索顺序： base/cliq, base, base.parent()
    let mut candidates: Vec<PathBuf> = Vec::new();
    candidates.push(base.join("cliq"));
    candidates.push(base.clone());
    if let Some(parent) = base.parent() {
        candidates.push(parent.to_path_buf());
    }

    for dir in candidates {
        // 仅当目录存在且为目录时才尝试搜索
        if !dir.exists() || !dir.is_dir() {
            continue;
        }

        // 首先查找以 cliq.json 结尾的文件
        let json_files: Vec<_> = std::fs::read_dir(&dir)
            .into_diagnostic()?
            .filter_map(|entry| {
                let entry = entry.ok()?;
                let path = entry.path();
                if let Some(name) = path.file_name().map(|s| s.to_string_lossy().to_string()) {
                    if name.ends_with("cliq.json") {
                        return Some(path);
                    }
                }
                None
            })
            .collect();

        if json_files.len() > 1 {
            return Err(miette::miette!(
                "Multiple .cliq.json files found in {}. Expected only one.",
                dir.display()
            ));
        } else if json_files.len() == 1 {
            let first_json_file = &json_files[0];
            let json_content = std::fs::read_to_string(first_json_file).into_diagnostic()?;
            return Ok(json_content);
        }

        // 如果没有找到 .cliq.json，再查找 usage.kdl
        let kdl_files: Vec<_> = std::fs::read_dir(&dir)
            .into_diagnostic()?
            .filter_map(|entry| {
                let entry = entry.ok()?;
                let path = entry.path();
                if let Some(name) = path.file_name().map(|s| s.to_string_lossy().to_string()) {
                    if name.ends_with("usage.kdl") {
                        return Some(path);
                    }
                }
                None
            })
            .collect();

        if kdl_files.len() > 1 {
            return Err(miette::miette!(
                "Multiple .usage.kdl files found in {}. Expected only one.",
                dir.display()
            ));
        } else if kdl_files.len() == 1 {
            let first_kdl_file = &kdl_files[0];
            let (spec, _) = Spec::parse_file(first_kdl_file)?;
            return serde_json::to_string_pretty(&spec).into_diagnostic();
        }

        // 如果在当前目录未找到任何匹配项，继续到下一个候选目录
    }

    // 遍历完所有候选目录后仍未找到任何文件
    Err(miette::miette!(
        "No .cliq.json or usage.kdl file found in expected locations."
    ))
}

#[tauri::command]
fn get_cliq_json() -> Result<String, String> {
    generate_cliq_json().map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, get_cliq_json])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
