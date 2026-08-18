import { MenuItem, TextField } from "@mui/material";
import { Institution } from "../../types/institution";

interface Props {
  institutions: Institution[];
  value: number | "all";
  onChange: (value: number | "all") => void;
  allowAll?: boolean;
  disabled?: boolean;
}

export default function InstitutionSelect({ institutions, value, onChange, allowAll = false, disabled = false }: Props) {
  return (
    <TextField
      select
      label="Institution"
      value={String(value)}
      disabled={disabled}
      onChange={(event) => {
        const next = event.target.value;
        onChange(next === "all" ? "all" : Number(next));
      }}
    >
      {allowAll ? <MenuItem value="all">ALL</MenuItem> : null}
      {institutions.map((institution) => (
        <MenuItem key={institution.id} value={institution.id}>
          {institution.name}
        </MenuItem>
      ))}
    </TextField>
  );
}
