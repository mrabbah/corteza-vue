import { apiClients, automation } from '@cortezaproject/corteza-js'
import { ActionContext, StoreOptions } from 'vuex'

const lightPromptRefs = [
  'alert',
  'choice',
  'input',
  'options',
]

interface Options {
  api: apiClients.Automation;
  watchInterval: number;
}

interface State {
  loading: boolean;
  prompts: Array<automation.Prompt>;

  /**
   * Is prompt component active (modal open)?
   *   prompt = modal is opwn, show this/current prompt
   *   true   = modal is open, show list of pending prompts
   *   false  = modal is closed
   */
  active: automation.Prompt | boolean;

  // watch interval pointer
  wiptr?: number;
}

interface ResumePayload {
  prompt: automation.Prompt;
  input: automation.Vars;
}

async function loadPrompts (api: apiClients.Automation): Promise<Array<automation.Prompt>> {
  return api.sessionListPrompts().then(({ set } = {}) => {
    if (!Array.isArray(set)) {
      return []
    }

    return set.map((p: automation.Prompt) => new automation.Prompt(p))
  })
}

async function resumeState (api: apiClients.Automation, { sessionID, stateID }: automation.Prompt, input: automation.Vars): Promise<unknown> {
  return api.sessionResumeState({ sessionID, stateID, input })
}

async function cancelState (api: apiClients.Automation, { sessionID, stateID }: automation.Prompt): Promise<unknown> {
  return api.sessionDeleteState({ sessionID, stateID })
}

function onlyFresh (existing: Array<automation.Prompt>, fresh: Array<automation.Prompt>): Array<automation.Prompt> {
  const index = existing.map(({ stateID }) => stateID)
  return fresh.filter(({ stateID = undefined }) => stateID && !index.includes(stateID))
}

export default function ({ api, watchInterval = 10000 }: Options): StoreOptions<State> {
  return {
    strict: true,

    state: {
      loading: false,
      active: false,
      prompts: [],
      wiptr: undefined,
    },

    getters: {
      all ({ prompts }: State): Array<automation.Prompt> {
        return prompts
      },

      isLoading ({ loading }: State): boolean {
        return loading
      },

      isActive ({ active }: State): boolean {
        return active !== false
      },

      current ({ active }: State): automation.Prompt | undefined {
        if (typeof active === 'boolean') {
          return undefined
        } else {
          return active
        }
      },

      nextLight (state: State): automation.Prompt | undefined {
        return state.prompts.find(({ ref }) => lightPromptRefs.includes(ref))
      },
    },

    actions: {
      watch ({ state, commit, dispatch }: ActionContext<State, State>): void {
        clearInterval(state.wiptr)
        // dispatch update right away and if there are no problems
        // init update interval fn
        dispatch('update').then(() => {
          commit(
            'watching',
            setInterval(() => {
              dispatch('update')
            }, watchInterval),
          )
        })
      },

      openModal ({ commit }: ActionContext<State, State>): void {
        commit('showModal', true)
      },

      closeModal ({ commit }: ActionContext<State, State>): void {
        commit('showModal', false)
      },

      async activate ({ commit }: ActionContext<State, State>, m?: true | automation.Prompt): Promise<void> {
        commit('active', m ?? true)
      },

      async deactivate ({ commit }: ActionContext<State, State>): Promise<void> {
        commit('active', false)
      },

      unwatch ({ state, commit }: ActionContext<State, State>): void {
        commit('watching', undefined)
        clearInterval(state.wiptr)
      },

      // fetch calls automation API endpoint and collects all states
      async update ({ commit, state }: ActionContext<State, State>): Promise<void> {
        return loadPrompts(api)
          .then(pp => {
            if (pp.length === 0) {
              // purge all
              commit('clear')
              return
            }

            // filter fresh prompts before committing
            // to minimize store traffic & state changes
            const fresh = onlyFresh(state.prompts, pp)
            if (fresh.length > 0) {
              commit('update', fresh)
            }
          })
      },

      async resume ({ commit, dispatch }: ActionContext<State, State>, { prompt, input }: ResumePayload): Promise<void> {
        commit('loading')
        return resumeState(api, prompt, input)
          .then(() => commit('remove', prompt))
          /**
           * Recheck for new prompts right after we submit
           * Later, we'll rely on websocket messages
           */
          .then(() => { setTimeout(() => { dispatch('update') }, 1000) })
          .finally(() => commit('loading', false))
      },

      async remove ({ commit }: ActionContext<State, State>, prompt: automation.Prompt): Promise<void> {
        commit('loading')
        return cancelState(api, prompt)
          .then(() => commit('remove', prompt))
          .finally(() => commit('loading', false))
      },
    },

    mutations: {
      loading (state: State, flag = true): void {
        state.loading = flag
      },

      watching (state: State, ptr?: number): void {
        state.wiptr = ptr
      },

      active (state: State, m: boolean | automation.Prompt): void {
        state.active = m
      },

      clear (state: State): void {
        state.prompts = []
      },

      update (state: State, pp: Array<automation.Prompt>): void {
        state.prompts.push(...pp)
      },

      remove (state: State, prompt: automation.Prompt): void {
        state.prompts = state.prompts.filter(({ stateID }) => stateID !== prompt.stateID)

        if (typeof state.active === 'object' && state.active.stateID === prompt.stateID) {
          // When removed prompt is also active,
          // reset active value.
          //
          // Set it to true but only if there are more prompts pending
          state.active = state.prompts.length > 0
        }
      },
    },
  }
}