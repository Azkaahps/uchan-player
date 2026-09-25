use crate::ipc::dto::AppInfoDto;

#[tauri::command]
pub fn get_app_info() -> AppInfoDto {
    AppInfoDto {
        name: "Uchan Player".to_string(),
        version: "0.1.0".to_string(),
        author: "AzkaaHPS".to_string(),
        credit: "Created By AzkaaHPS".to_string(),
    }
}
