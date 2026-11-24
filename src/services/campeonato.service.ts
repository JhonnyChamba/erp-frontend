import { api } from '@/services/axios';

export interface PositionItem {
  id: number;
  companyId?: number;
  tournamentId?: number;
  name: string;
  code?: string;
  scope: 'TOURNAMENT' | 'TEAM' | 'ARBITRAL';
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface DemarcationItem {
  id: number;
  companyId?: number;
  name: string;
  code: string;
  zone: 'GOALKEEPER' | 'DEFENDER' | 'MIDFIELDER' | 'FORWARD';
  order: number;
  createdAt: string;
  updatedAt?: string;
}

export interface TeamItem {
  id: number;
  companyId?: number;
  tournamentId?: number;
  name: string;
  shortName?: string;
  logo?: string;
  color1: string;
  color2?: string;
  colorAlternate?: string;
  dateOfFoundation?: string;
  acronyms: string;
  email?: string;
  representativePhone?: string;
  city?: string;
  neighborhood?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PlayerItem {
  id: number;
  companyId?: number;
  tournamentId?: number;
  demarcationId?: number;
  demarcation?: DemarcationItem;
  playerClassificationId?: number;
  playerClassification?: PlayerClassificationItem;
  name: string;
  lastName: string;
  identification: string;
  isForeigner: boolean;
  birthDate?: string;
  gender: 'MALE' | 'FEMALE' | 'MIXED';
  jerseyNumber?: number;
  address?: string;
  phone?: string;
  email?: string;
  photo?: string;
  bloodType?: string;
  dominantFoot?: 'RIGHT' | 'LEFT' | 'BOTH';
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalClearanceExpiry?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CategoryItem {
  id: number;
  companyId?: number;
  tournamentId?: number;
  name: string;
  description?: string;
  code?: string;
  gender: 'MALE' | 'FEMALE' | 'MIXED';
  minAge?: number;
  maxAge?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface EditionCategoryClassificationItem {
  id?: number;
  categoryDetailId?: number;
  playerClassificationId: number;
  playerClassification?: PlayerClassificationItem;
  maxPlayers: number;
}

export interface EditionCategoryDetailItem {
  id?: number;
  companyId?: number;
  tournamentId?: number;
  editionId?: number;
  categoryId: number;
  category?: CategoryItem;
  categoryDescription?: string;
  startDate?: string;
  endDate?: string;
  registrationFee?: number;
  maxPlayers?: number;
  classifications?: EditionCategoryClassificationItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryEditionItem {
  id: number;
  companyId?: number;
  tournamentId?: number;
  categoryId?: number;
  category?: CategoryItem;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  minPlayersPerTeam: number;
  maxPlayersPerTeam: number;
  minPlayersPerMatch: number;
  registrationFee: number;
  guaranteeFee: number;
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  categoriesDetail?: EditionCategoryDetailItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface StageItem {
  id: number;
  companyId?: number;
  tournamentId?: number;
  categoryEditionId: number;
  categoryEdition?: CategoryEditionItem;
  name: string;
  description?: string;
  stageOrder: number;
  teamOrigin: 'FULL_CATEGORY' | 'PREVIOUS_STAGE';
  previousStageId?: number;
  numberOfExpectedTeams: number;
  format: 'EVERYONE_AGAINST_EVERYONE' | 'DIRECT_ELIMINATION' | 'DOUBLE_ELIMINATION';
  numberOfLaps: number;
  numberOfGroups?: number;
  intersectionType: 'PREVIOUS_RANKING' | 'RANDOM_DRAW' | 'FIXED_BRACKET';
  predefinedCrosses?: any;
  matchDurationMinutes: number;
  maxPlayersPerTeam?: number;
  allowExtraTime: boolean;
  allowPenalties: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PlayerClassificationItem {
  id: number;
  companyId?: number;
  description: string;
  code?: string;
  observation?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ScenaryItem {
  id: number;
  companyId?: number;
  tournamentId?: number;
  name: string;
  location?: string;
  code?: string;
  surfaceType: 'NATURAL_GRASS' | 'SYNTHETIC' | 'DIRT' | 'PARQUET_CONCRETE';
  hasLighting: boolean;
  googleMapsUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface TeamRegistrationItem {
  id: number;
  companyId?: number;
  tournamentId?: number;
  categoryEditionId: number;
  categoryEdition?: CategoryEditionItem;
  categoryId?: number;
  category?: CategoryItem;
  teamId: number;
  team?: TeamItem;
  groupName?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISQUALIFIED';
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED';
  pointsPenalty: number;
  createdAt: string;
  updatedAt?: string;
}

export interface PlayerRegistrationItem {
  id: number;
  companyId?: number;
  tournamentId?: number;
  teamRegistrationId: number;
  teamRegistration?: TeamRegistrationItem;
  playerId: number;
  player?: PlayerItem;
  stageId?: number;
  stage?: StageItem;
  playerClassificationId?: number;
  playerClassification?: PlayerClassificationItem;
  jerseyNumber: number;
  carnetCode?: string;
  status: 'ELIGIBLE' | 'INELIGIBLE' | 'SUSPENDED' | 'TRANSFERRED';
  isCaptain: boolean;
  registrationDate: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RefereeGuildItem {
  id: number;
  description: string;
  acronyms?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface RefereeItem {
  id: number;
  companyId?: number;
  tournamentId?: number;
  guildId?: number;
  guild?: RefereeGuildItem;
  name: string;
  lastName: string;
  identification: string;
  phone?: string;
  email?: string;
  category?: string;
  isActive: boolean;
  companyRefereeId?: number;
  isActiveInCompany?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface VocalItem {
  id: number;
  companyId?: number;
  tournamentId?: number;
  teamId?: number;
  team?: TeamItem;
  name: string;
  lastName: string;
  identification: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface MatchItem {
  id: number;
  companyId?: number;
  tournamentId?: number;
  stageId: number;
  stage?: StageItem;
  scenaryId?: number;
  scenary?: ScenaryItem;
  localTeamId: number;
  localTeam?: TeamItem;
  awayTeamId: number;
  awayTeam?: TeamItem;
  date: string;
  roundNumber?: number;
  homeGoals: number;
  awayGoals: number;
  homeExtraGoals?: number;
  awayExtraGoals?: number;
  homePenalties?: number;
  awayPenalties?: number;
  winnerTeamId?: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'POSTPONED' | 'SUSPENDED' | 'CANCELLED' | 'WALKOVER';
  meetingType: 'UNICO' | 'IDA' | 'VUELTA';
  llaveId?: string;
  isWalkover: boolean;
  refereeId?: number;
  referee?: RefereeItem;
  vocalId?: number;
  vocal?: VocalItem;
  vocalTeamId?: number;
  vocalTeam?: TeamItem;
  vocalMemberName?: string;
  vocalObservations?: string;
  refereeObservations?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MatchLineupItem {
  id: number;
  companyId?: number;
  tournamentId?: number;
  matchId: number;
  match?: MatchItem;
  teamId: number;
  team?: TeamItem;
  playerId: number;
  player?: PlayerItem;
  stageId?: number;
  stage?: StageItem;
  playerClassificationId?: number;
  playerClassification?: PlayerClassificationItem;
  jerseyNumber: number;
  isStarter: boolean;
  isCaptain: boolean;
  hasPlayed: boolean;
  minutesPlayed: number;
  createdAt: string;
  updatedAt?: string;
}

export interface MatchEventItem {
  id: number;
  companyId?: number;
  tournamentId?: number;
  matchId: number;
  match?: MatchItem;
  teamId: number;
  team?: TeamItem;
  playerId: number;
  player?: PlayerItem;
  eventType: 'GOAL' | 'PENALTY_GOAL' | 'OWN_GOAL' | 'MISSED_PENALTY' | 'YELLOW_CARD' | 'SECOND_YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION' | 'INJURY';
  minute?: number;
  extraMinute?: number;
  playerOutId?: number;
  playerOut?: PlayerItem;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SanctionItem {
  id: number;
  companyId?: number;
  tournamentId?: number;
  matchId?: number;
  match?: MatchItem;
  playerId: number;
  player?: PlayerItem;
  type: 'YELLOW_CARD_ACCUMULATION' | 'RED_CARD_DIRECT' | 'DOUBLE_YELLOW' | 'PHYSICAL_AGGRESSION' | 'VERBAL_AGGRESSION' | 'REGULATION_INFRACTION';
  matchesSuspended: number;
  matchesServed: number;
  fineAmount: number;
  status: 'PENDING' | 'SERVED' | 'PARDONED' | 'APPEALED';
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentItem {
  id: number;
  companyId?: number;
  tournamentId?: number;
  teamRegistrationId?: number;
  teamRegistration?: TeamRegistrationItem;
  concept: 'REGISTRATION_FEE' | 'GUARANTEE_FEE' | 'MATCH_ARBITRATION' | 'SANCTION_FINE' | 'CARNET_ISSUANCE' | 'OTHER';
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'ONLINE_GATEWAY';
  status: 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED';
  receiptNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TournamentCommitteeItem {
  id: number;
  companyId?: number;
  tournamentId?: number;
  positionId: number;
  position?: PositionItem;
  name: string;
  lastName: string;
  identification: string;
  cellphone?: string;
  email?: string;
  address?: string;
  photo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface TeamManagementItem {
  id: number;
  companyId?: number;
  tournamentId?: number;
  positionId?: number;
  position?: PositionItem;
  roleTitle?: string;
  teamId: number;
  team?: TeamItem;
  playerId?: number;
  player?: PlayerItem;
  name: string;
  lastName: string;
  identification: string;
  cellphone?: string;
  email?: string;
  address?: string;
  licenseNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const withCompany = (companyId?: number) => (companyId ? { headers: { 'x-company-id': String(companyId) } } : {});

export const createCrudService = <T>(endpoint: string) => ({
  list: (params?: { page?: number; limit?: number; search?: string; [key: string]: any }, companyId?: number) =>
    api.get<PaginatedResponse<T>>(`/campeonato/${endpoint}`, { params, ...withCompany(companyId) }),
  get: (id: number, companyId?: number) =>
    api.get<T>(`/campeonato/${endpoint}/${id}`, withCompany(companyId)),
  create: (data: Partial<T>, companyId?: number) =>
    api.post<T>(`/campeonato/${endpoint}`, data, withCompany(companyId)),
  update: (id: number, data: Partial<T>, companyId?: number) =>
    api.patch<T>(`/campeonato/${endpoint}/${id}`, data, withCompany(companyId)),
  delete: (id: number, companyId?: number, params?: Record<string, any>) =>
    api.delete<{ raw: any; affected?: number }>(`/campeonato/${endpoint}/${id}`, { params, ...withCompany(companyId) }),
});

export const PositionsService = createCrudService<PositionItem>('positions');
export const DemarcationsService = createCrudService<DemarcationItem>('demarcations');
export const TeamsService = createCrudService<TeamItem>('teams');
export const PlayersService = {
  ...createCrudService<PlayerItem>('players'),
  findGlobal: (identification: string, companyId?: number) =>
    api.get<{ exists: boolean; player: any; isLinkedToCurrentCompany?: boolean }>(
      `/campeonato/players/find-global/${encodeURIComponent(identification.trim())}`,
      withCompany(companyId)
    ),
  consultaRegistroCivil: (identification: string, companyId?: number) =>
    api.get<{
      exists: boolean;
      source?: 'LOCAL_PADRON' | 'REGISTRO_CIVIL' | null;
      isValidCedula: boolean;
      player?: any;
      isLinkedToCurrentCompany?: boolean;
      message?: string;
    }>(
      `/campeonato/players/consulta-registro-civil/${encodeURIComponent(identification.trim())}`,
      withCompany(companyId)
    ),
};
export const CategoriesService = createCrudService<CategoryItem>('categories');
export const CategoryEditionsService = createCrudService<CategoryEditionItem>('category-editions');
export const StagesService = {
  ...createCrudService<StageItem>('stages'),
  listClassifications: (stageId: number, companyId?: number) =>
    api.get<{
      stageId: number;
      stageName: string;
      maxPlayersPerTeam?: number;
      totalDistributed: number;
      remainingSlots: number | null;
      data: any[];
    }>(`/campeonato/stages/${stageId}/classifications`, withCompany(companyId)),
  addClassification: (stageId: number, data: { playerClassificationId: number; maxPlayers: number }, companyId?: number) =>
    api.post<any>(`/campeonato/stages/${stageId}/classifications`, data, withCompany(companyId)),
  updateClassification: (classificationId: number, data: { maxPlayers: number }, companyId?: number) =>
    api.put<any>(`/campeonato/stages/classifications/${classificationId}`, data, withCompany(companyId)),
  removeClassification: (classificationId: number, companyId?: number) =>
    api.delete<any>(`/campeonato/stages/classifications/${classificationId}`, withCompany(companyId)),
};
export const ScenariesService = createCrudService<ScenaryItem>('scenaries');
export const PlayerClassificationsService = createCrudService<PlayerClassificationItem>('player-classifications');
export const TeamRegistrationsService = {
  ...createCrudService<TeamRegistrationItem>('team-registrations'),
  listGrouped: (params?: Record<string, any>, companyId?: number) => api.get<any>('/campeonato/team-registrations/grouped', { params, ...withCompany(companyId) }),
  syncByEdition: (
    data: {
      categoryEditionId: number;
      categories: Array<{
        categoryId: number;
        teams: Array<{
          id?: number;
          teamId: number;
          groupName?: string;
          status?: string;
          paymentStatus?: string;
          pointsPenalty?: number;
        }>;
      }>;
    },
    companyId?: number
  ) => api.post<any>('/campeonato/team-registrations/sync-edition', data, withCompany(companyId)),
};
export const PlayerRegistrationsService = {
  ...createCrudService<PlayerRegistrationItem>('player-registrations'),
  listGrouped: (params?: Record<string, any>, companyId?: number) =>
    api.get<any>('/campeonato/player-registrations/grouped', { params, ...withCompany(companyId) }),
  syncTeamRoster: (
    data: {
      categoryEditionId: number;
      teamId: number;
      categories: Array<{
        teamRegistrationId: number;
        players: Array<{
          id?: number;
          playerId: number;
          jerseyNumber: number;
          carnetCode?: string;
          playerClassificationId?: number;
          isCaptain?: boolean;
        }>;
      }>;
    },
    companyId?: number,
  ) => api.post<any>('/campeonato/player-registrations/sync-team-roster', data, withCompany(companyId)),
  massCreate: (data: { teamRegistrationId: number; stageId?: number; registrations: any[] }, companyId?: number) =>
    api.post<any>('/campeonato/player-registrations/mass', data, withCompany(companyId)),
  updateStatus: (id: number, data: { status: string; comments?: string }, companyId?: number) =>
    api.patch<any>(`/campeonato/player-registrations/${id}/status`, data, withCompany(companyId)),
  getRoster: (teamRegistrationId: number, companyId?: number) =>
    api.get<any>(`/campeonato/player-registrations/roster/${teamRegistrationId}`, withCompany(companyId)),
};
export const RefereeGuildsService = createCrudService<RefereeGuildItem>('referee-guilds');
export const RefereesService = {
  ...createCrudService<RefereeItem>('referees'),
  findGlobal: (identification: string, companyId?: number) =>
    api.get<{
      exists: boolean;
      referee: RefereeItem | null;
      isLinkedToCurrentCompany: boolean;
    }>(`/campeonato/referees/find-global/${encodeURIComponent(identification)}`, withCompany(companyId)),
};
export const VocalsService = createCrudService<VocalItem>('vocals');
export const MatchesService = {
  ...createCrudService<MatchItem>('matches'),
  getStandings: (stageId?: number, companyId?: number) =>
    api.get<{ standings: any[]; topScorers: any[]; totalMatchesPlayed: number }>('/campeonato/matches/standings', {
      params: { stageId },
      ...withCompany(companyId),
    }),
  generateFixture: (
    data: { stageId: number; teamIds: number[]; scenaryId?: number; startDate: string; matchDurationMinutes?: number; intervalDays?: number; numberOfLaps?: number },
    companyId?: number
  ) =>
    api.post<{ success: boolean; message: string; matchesCount: number; roundsCount: number }>('/campeonato/matches/generate-fixture', data, withCompany(companyId)),
};
export const MatchLineupsService = createCrudService<MatchLineupItem>('match-lineups');
export const MatchEventsService = createCrudService<MatchEventItem>('match-events');
export const SanctionsService = createCrudService<SanctionItem>('sanctions');
export const PaymentsService = createCrudService<PaymentItem>('payments');
export const TournamentCommitteesService = createCrudService<TournamentCommitteeItem>('committees');
export const TeamManagementsService = {
  ...createCrudService<TeamManagementItem>('team-managements'),
  listByTeam: (teamId: number, companyId?: number) =>
    api.get<TeamManagementItem[]>(`/campeonato/team-managements/by-team/${teamId}`, withCompany(companyId)),
};

export const uploadTeamLogo = async (file: File, companyId?: number): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<{ url: string }>('/storage/team-logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data', ...withCompany(companyId).headers },
    params: companyId ? { companyId } : undefined,
  });
  return data.url;
};

export const uploadPlayerPhoto = async (file: File, companyId?: number): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<{ url: string }>('/storage/player-photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data', ...withCompany(companyId).headers },
    params: companyId ? { companyId } : undefined,
  });
  return data.url;
};

export const TeamCategoryHistoryService = {
  listByTeam: (teamId: number, companyId?: number) =>
    api.get<any[]>(`/campeonato/team-category-history/${teamId}`, withCompany(companyId)),
  create: (data: any, companyId?: number) =>
    api.post<any>('/campeonato/team-category-history', data, withCompany(companyId)),
  delete: (id: number, companyId?: number) =>
    api.delete<any>(`/campeonato/team-category-history/${id}`, withCompany(companyId)),
};

export const PlayerTransfersService = {
  ...createCrudService<any>('player-transfers'),
  listByPlayer: (playerId: number, companyId?: number) =>
    api.get<any[]>(`/campeonato/player-transfers/player/${playerId}`, withCompany(companyId)),
  getSportsHistory: (playerId: number, companyId?: number) =>
    api.get<any>(`/campeonato/player-transfers/sports-history/${playerId}`, withCompany(companyId)),
  createRequest: (data: any, companyId?: number) =>
    api.post<any>('/campeonato/player-transfers', data, withCompany(companyId)),
  approve: (id: number, data: { role: string; status: string; comments?: string }, companyId?: number) =>
    api.post<any>(`/campeonato/player-transfers/${id}/approve`, data, withCompany(companyId)),
  execute: (id: number, companyId?: number) =>
    api.post<any>(`/campeonato/player-transfers/${id}/execute`, {}, withCompany(companyId)),
};

export const TournamentTransferConfigsService = {
  getByEdition: (editionId: number, companyId?: number) =>
    api.get<any>(`/campeonato/tournament-transfer-configs/${editionId}`, withCompany(companyId)),
  upsert: (editionId: number, data: any, companyId?: number) =>
    api.put<any>(`/campeonato/tournament-transfer-configs/${editionId}`, data, withCompany(companyId)),
};

export const StageFormatsService = createCrudService<any>('stage-formats');
export const StageTemplatesService = createCrudService<any>('stage-templates');
export const CompetitionTypesService = createCrudService<any>('competition-types');
export const CompetitionLapsService = createCrudService<any>('competition-laps');
export const TieBreakerCriteriaService = createCrudService<any>('tie-breaker-criteria');

export const CampeonatoApi = {
  positions: PositionsService,
  demarcations: DemarcationsService,
  teams: TeamsService,
  players: PlayersService,
  categories: CategoriesService,
  categoryEditions: CategoryEditionsService,
  // Etapas reales (tab_campeonato_stages). Las plantillas de etapas van por `stageTemplates`.
  stages: StagesService,
  stageTemplates: StageTemplatesService,
  stageFormats: StageFormatsService,
  competitionTypes: CompetitionTypesService,
  competitionLaps: CompetitionLapsService,
  tieBreakerCriteria: TieBreakerCriteriaService,
  scenaries: ScenariesService,
  teamRegistrations: TeamRegistrationsService,
  playerRegistrations: PlayerRegistrationsService,
  referees: RefereesService,
  refereeGuilds: RefereeGuildsService,
  vocals: VocalsService,
  matches: MatchesService,
  matchLineups: MatchLineupsService,
  matchEvents: MatchEventsService,
  sanctions: SanctionsService,
  payments: PaymentsService,
  committees: TournamentCommitteesService,
  teamManagements: TeamManagementsService,
  teamCategoryHistory: TeamCategoryHistoryService,
  playerTransfers: PlayerTransfersService,
  playerClassifications: PlayerClassificationsService,
  tournamentTransferConfigs: TournamentTransferConfigsService,
};

export const campeonatoService = {
  ...CampeonatoApi,
  getTournamentTransferConfig: (editionId: number, companyId?: number) =>
    TournamentTransferConfigsService.getByEdition(editionId, companyId).then((r: any) => r.data),
  saveTournamentTransferConfig: (editionId: number, payload: any, companyId?: number) =>
    TournamentTransferConfigsService.upsert(editionId, payload, companyId).then((r: any) => r.data),
  approveTransfer: (id: number, data: { role: string; status: string; comments?: string }, companyId?: number) =>
    PlayerTransfersService.approve(id, data, companyId).then((r: any) => r.data),
  executeTransfer: (id: number, companyId?: number) =>
    PlayerTransfersService.execute(id, companyId).then((r: any) => r.data),
  getSportsHistory: (playerId: number, companyId?: number) =>
    PlayerTransfersService.getSportsHistory(playerId, companyId).then((r: any) => r.data),
  getRosterByTeamRegistration: (teamRegId: number, companyId?: number) =>
    PlayerRegistrationsService.getRoster(teamRegId, companyId).then((r: any) => r.data),
  registerMass: (payload: any, companyId?: number) =>
    PlayerRegistrationsService.massCreate(payload, companyId).then((r: any) => r.data),
  updateRegistrationStatus: (id: number, payload: any, companyId?: number) =>
    PlayerRegistrationsService.updateStatus(id, payload, companyId).then((r: any) => r.data),
};
