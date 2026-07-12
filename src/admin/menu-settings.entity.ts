import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('menu_settings')
export class MenuSettings {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ length: 20, unique: true })
  role: string;

  @Column({ type: 'json' })
  config: Record<string, any>;
}
