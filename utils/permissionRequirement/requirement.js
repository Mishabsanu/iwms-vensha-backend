const ExtractRequiredPermission = (routeName) => {
  switch (routeName) {
    // user modules
    case "/add-user":
      return "user_create";
    case "/update-user":
      return "user_edit";
    case "/update-user-profile":
      return "user_edit";
    case "/list-user":
      return "user_view";
    case "/list-user-profile":
      return "user_view";
    case "/list-user-logs":
      return "user_view";
    case "/change-password":
      return "user_edit";
    case "/update-user-profile":
      return "user_edit";
    case "/admin-change-password":
      return "user_edit";
    case "/user-logs":
      return "user_edit";

    // role modules
    case "/add-role":
      return "role_create";
    case "/update-role":
      return "role_edit";
    case "/list-role":
      return "role_view";
    case "/list-role-logs":
      return "role_view";

    // material modules
    case "/add-material-master":
      return "material_master_create";
    case "/update-material-master":
      return "material_master_edit";
    case "/list-material-master":
      return "material_master_view";

    // pallete modules

    case "/add-pallete-master":
      return "pallete_master_create";
    case "/bulk-upload-pallete-master":
      return "pallete_master_create";
    case "/update-pallete-master":
      return "pallete_master_edit";
    case "/list-pallete-master":
      return "pallete_master_view";

    // Production Line modules

    case "/add-produntion-line-master":
      return "produntion_line_master_create";
    case "/bulk-upload-produntion-line-master":
      return "produntion_line_master_create";
    case "/update-produntion-line-master":
      return "produntion_line_master_edit";
    case "/list-produntion-line-master":
      return "production_line_master_view";

    case "/add-inbound":
      return "material_master_create";
    case "/update-inbound":
      return "material_master_edit";
    case "/list-inbound":
      return "role_view";

    default:
      return null;
  }
};
export { ExtractRequiredPermission };
