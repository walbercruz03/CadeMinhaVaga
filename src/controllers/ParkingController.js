/**
 * Camada de CONTROLLER - gerenciamento de estado do app.
 *
 * Singleton observable que orquestra:
 *  - inicialização do banco (modelo)
 *  - permissões e rastreamento de GPS (LocationController)
 *  - salvar/listar/excluir vagas (ParkingModel)
 *  - distância do usuário até a vaga salva
 *
 * As views consomem o estado via hook `useParkingState()`.
 */
import { useSyncExternalStore } from 'react';

import { initializeDatabase } from '../models/database';
import ParkingModel, { formatDistance, haversineDistance } from '../models/ParkingModel';
import LocationController from './LocationController';

const initialState = {
  isReady: false,
  loading: false,
  error: null,
  permissionStatus: 'undetermined',
  currentLocation: null,
  spots: [],
  latestSpot: null,
  distanceMeters: null,
  watching: false,
};

class ParkingController {
  constructor() {
    this.state = initialState;
    this.listeners = new Set();
    this.watchSubscription = null;
    this.initializing = false;
  }

  /** Assinatura para o useSyncExternalStore do React. */
  getState = () => this.state;

  subscribe = (listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  setState(patch) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  /** Inicializa banco + permissões + GPS. Pode ser chamado mais de uma vez. */
  async init() {
    if (this.initializing || this.state.isReady) return;
    this.initializing = true;
    this.setState({ loading: true, error: null });
    try {
      await initializeDatabase();
      const permissionStatus = await LocationController.requestPermission();
      const spots = await ParkingModel.findAll();
      this.setState({
        permissionStatus,
        spots,
        latestSpot: spots[0] ?? null,
        loading: false,
        isReady: true,
      });

      if (permissionStatus === 'granted') {
        await this.refreshLocation();
        await this.startWatching();
      }
    } catch (error) {
      this.setState({
        loading: false,
        isReady: true,
        error: error?.message ?? String(error),
      });
    } finally {
      this.initializing = false;
    }
  }

  /** Requisita permissão de novo e liga o GPS se concedida. */
  async requestAccess() {
    const permissionStatus = await LocationController.requestPermission();
    this.setState({ permissionStatus });
    if (permissionStatus === 'granted') {
      await this.refreshLocation();
      await this.startWatching();
    }
    return permissionStatus;
  }

  /** Atualiza a posição atual do usuário (uma vez). Retorna null se falhar. */
  async refreshLocation() {
    if (this.state.permissionStatus !== 'granted') {
      this.setState({
        error: 'Permissão de localização negada. Libere o acesso em Ajustes do app.',
      });
      return null;
    }
    try {
      const coord = await LocationController.getCurrentPosition();
      this.updateLocation(coord);
      return coord;
    } catch (error) {
      const detail = error?.message ?? String(error);
      this.setState({
        error: `Falha ao ler o GPS: ${detail}. Confira se a localização do aparelho está ativada.`,
      });
      return null;
    }
  }

  /** Aplica nova coordenada e recalcula a distância até a vaga. */
  updateLocation(coord) {
    const distanceMeters = this.computeDistance(coord, this.state.latestSpot);
    this.setState({ currentLocation: coord, distanceMeters });
  }

  /** Liga o rastreamento contínuo de GPS. */
  async startWatching() {
    if (this.watchSubscription || this.state.watching) return;
    this.setState({ watching: true });
    const subscription = await LocationController.watchPosition((coord) => {
      if (this.state.watching) this.updateLocation(coord);
    });
    if (this.state.watching) {
      this.watchSubscription = subscription;
    } else {
      subscription.remove();
    }
  }

  /** Desliga o rastreamento contínuo de GPS. */
  stopWatching() {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }
    this.setState({ watching: false });
  }

  computeDistance(coord, spot) {
    if (!coord || !spot) return null;
    return haversineDistance(coord.latitude, coord.longitude, spot.latitude, spot.longitude);
  }

  /**
   * Salva uma vaga no banco.
   * @param {string} label nome da vaga (ex.: "Shopping P3 - 2º andar")
   * @param {{latitude:number, longitude:number}|null} coord coordenada opcional;
   *        se informada (ex.: ponto tocado no mapa), usa-a; senão usa o GPS atual.
   */
  async saveSpot(label, coord = null) {
    this.setState({ loading: true, error: null });
    try {
      let origin = coord ?? this.state.currentLocation;
      if (!origin) origin = await this.refreshLocation();
      if (!origin) {
        throw new Error('Localização indisponível. Ative o GPS e tente novamente.');
      }

      const trimmedLabel = (label ?? '').trim() || 'Minha vaga';
      const spot = await ParkingModel.create({
        latitude: origin.latitude,
        longitude: origin.longitude,
        label: trimmedLabel,
      });

      const spots = [spot, ...this.state.spots];
      this.setState({
        spots,
        latestSpot: spot,
        distanceMeters: this.computeDistance(this.state.currentLocation, spot),
        loading: false,
      });
      return spot;
    } catch (error) {
      this.setState({ loading: false, error: error?.message ?? String(error) });
      throw error;
    }
  }

  /** Exclui uma vaga salva. */
  async deleteSpot(id) {
    await ParkingModel.remove(id);
    const spots = this.state.spots.filter((spot) => spot.id !== id);
    const latestSpot = spots[0] ?? null;
    this.setState({
      spots,
      latestSpot,
      distanceMeters: this.computeDistance(this.state.currentLocation, latestSpot),
    });
  }

  /** Recalcula distância manualmente (ex.: botão "atualizar"). */
  recomputeDistance() {
    this.setState({
      distanceMeters: this.computeDistance(this.state.currentLocation, this.state.latestSpot),
    });
  }
}

export const parkingController = new ParkingController();

/** Hook React para consumir o estado do controller nas views. */
export function useParkingState() {
  return useSyncExternalStore(
    parkingController.subscribe,
    parkingController.getState,
    parkingController.getState
  );
}

export { formatDistance };
export default parkingController;
