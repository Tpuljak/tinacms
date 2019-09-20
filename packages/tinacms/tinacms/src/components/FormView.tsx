import * as React from 'react'
import { FormBuilder, FieldsBuilder } from '@tinacms/form-builder'
import { useCMS, useSubscribable } from '@tinacms/react-tinacms'
import { EllipsisVerticalIcon } from '@tinacms/icons'
import { TextField } from '@tinacms/fields'
import { useState } from 'react'
import { Form, ScreenPlugin } from '@tinacms/core'
import styled, { css } from 'styled-components'
import { Modal, ModalBody, ModalHeader } from '..'
import {
  GlobalStyles,
  TinaResetStyles,
  TinaReset,
  Theme,
  padding,
  color,
} from '@tinacms/styles'
import { Button } from './Button'
import { ActionsMenu } from './ActionsMenu'
import FormsList from './FormsList'
import EditingFormTitle from './EditingFormTitle'

export const FormsView = () => {
  const cms = useCMS()
  const forms = cms.forms.all()
  const [editingForm, setEditingForm] = useState<Form | null>(() => {
    return cms.forms.all()[0] as Form | null
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isMultiform, setIsMultiform] = useState(false)

  useSubscribable(cms.forms, () => {
    const forms = cms.forms.all()
    if (forms.length == 1) {
      setIsMultiform(false)
      setEditingForm(forms[0])
      return
    }

    //if multiforms, set default view to formslist
    if (forms.length > 1) {
      setIsMultiform(true)
      //if they navigate to another page w/ no active form, reset
      !editingForm && setEditingForm(null)
    }

    if (editingForm && forms.findIndex(f => f.id == editingForm.id) < 0) {
      setEditingForm(null)
    }
  })

  //Toggles editing prop for component animations
  React.useEffect(() => {
    editingForm ? setIsEditing(true) : setIsEditing(false)
  })

  /**
   * No Forms
   */
  if (!forms.length)
    return (
      <FieldsWrapper>
        <NoFormsPlaceholder />
      </FieldsWrapper>
    )
  if (!editingForm)
    return (
      <FormsList
        isEditing={isEditing}
        forms={forms}
        activeForm={editingForm}
        setActiveForm={setEditingForm}
      />
    )

  return (
    <>
      <FormBuilder form={editingForm as any}>
        {({ handleSubmit, pristine, form }) => {
          return (
            <TransitionForm isEditing={isEditing}>
              <EditingFormTitle
                isMultiform={isMultiform}
                form={editingForm as any}
                setEditingForm={setEditingForm as any}
              />
              <FieldsWrapper>
                {editingForm &&
                  (editingForm.fields.length ? (
                    <FieldsBuilder form={editingForm} />
                  ) : (
                    <NoFieldsPlaceholder />
                  ))}
              </FieldsWrapper>
              <FormsFooter>
                <SaveButton onClick={() => handleSubmit()} disabled={pristine}>
                  Save
                </SaveButton>
                {editingForm.actions.length > 0 && (
                  <ActionsMenu actions={editingForm.actions} />
                )}
              </FormsFooter>
            </TransitionForm>
          )
        }}
      </FormBuilder>
    </>
  )
}

const CreateContentButton = ({ plugin }: any) => {
  let cms = useCMS()
  let [postName, setPostName] = React.useState('')
  let [open, setOpen] = React.useState(false)
  return (
    <div>
      <CreateButton onClick={() => setOpen(p => !p)}>
        {plugin.name}
      </CreateButton>
      {open && (
        <Modal>
          <ModalHeader>Create</ModalHeader>
          <ModalBody>
            <TextField
              onChange={e => setPostName(e.target.value)}
              value={postName}
            />

            <SaveButton
              onClick={() => {
                plugin.onSubmit(postName, cms)
                setOpen(false)
              }}
            >
              Save
            </SaveButton>
          </ModalBody>
        </Modal>
      )}
    </div>
  )
}

export const MediaView: ScreenPlugin = {
  __type: 'screen',
  name: 'Media Manager',
  icon: 'forestry-logo',
  Component: () => {
    return <h2>Hello World</h2>
  },
}

export const SettingsView: ScreenPlugin = {
  __type: 'screen',
  name: 'Site Settings',
  icon: 'forestry-logo',
  Component: () => {
    return <h2>Hello World</h2>
  },
}

const Emoji = styled.span`
  font-size: 2.5rem;
  line-height: 1;
  display: inline-block;
`

const EmptyState = styled.div`
  > *:first-child {
    margin: 0 0 1rem 0;
  }
  h3 {
    font-size: 1.2rem;
    font-weight: normal;
    color: inherit;
    display: block;
    margin: 0 0 1rem 0;
    ${Emoji} {
      font-size: 1em;
    }
  }
  p {
    display: block;
    margin: 0 0 1rem 0;
  }
`

const LinkButton = styled.a`
  text-align: center;
  border: 0;
  border-radius: ${p => p.theme.radius.big};
  box-shadow: ${p => p.theme.shadow.small};
  font-weight: 500;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all ${p => p.theme.timing.short} ease-out;
  background-color: ${color('light')};
  color: ${color('dark')};
  padding: ${padding('small')}rem ${padding('big')}rem ${padding('small')}rem
    3.5rem;
  position: relative;
  text-decoration: none;
  display: inline-block;
  ${Emoji} {
    font-size: 1.5rem;
    position: absolute;
    left: ${padding('big')}rem;
    top: 50%;
    transform-origin: 50% 50%;
    transform: translate3d(0, -50%, 0);
    transition: all ${p => p.theme.timing.short} ease-out;
  }
  &:hover {
    color: ${color('primary')};
    ${Emoji} {
      transform: translate3d(0, -50%, 0);
    }
  }
`

const NoFormsPlaceholder = () => (
  <EmptyState>
    <Emoji>🎉 👋</Emoji>
    <h3>
      Welcome to <b>Tina</b>!
    </h3>
    <p>Let's get a form set up so you can start editing.</p>
    <p>
      <LinkButton
        href="https://github.com/tinacms/tinacms-site/blob/master/docs/gatsby/content-editing.md"
        target="_blank"
      >
        <Emoji>📖</Emoji> Form Setup Guide
      </LinkButton>
    </p>
  </EmptyState>
)

const NoFieldsPlaceholder = () => (
  <EmptyState>
    <Emoji>🤔</Emoji>
    <h3>Hey, you don't have any fields added to this form.</h3>
    <p>
      <LinkButton
        href="https://github.com/tinacms/tinacms-site/blob/master/docs/gatsby/content-editing.md"
        target="_blank"
      >
        <Emoji>📖</Emoji> Field Setup Guide
      </LinkButton>
    </p>
  </EmptyState>
)

const CreateButton = styled(Button)`
  width: 100%;
`

export const FieldsWrapper = styled.div`
  scrollbar-width: none;
  width: 100%;
  padding: ${padding()}rem ${padding()}rem 0 ${padding()}rem;
  overflow-y: auto;
  flex: 1 0 4rem;
  ul,
  li {
    margin: 0;
    padding: 0;
    list-style: none;
  }
`

const TransitionForm = styled.section<{ isEditing: Boolean }>`
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  transition: transform 150ms ease-out;
  transform: translate3d(${p => (!p.isEditing ? '100%' : '0')}, 0, 0);
`

const FormsFooter = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 4rem;
  background-color: white;
  border-top: 1px solid #efefef;
  padding: 0.75rem 1.25rem;
  flex: 0 0 4rem;
`

export const SaveButton = styled(Button)`
  flex: 1 0 auto;
  padding: 0.75rem 1.5rem;
`

export const CancelButton = styled(SaveButton)`
  background-color: transparent;
  border: 1px solid #0084ff;
  color: #0084ff;
  &:hover {
    background-color: #f7f7f7;
    opacity: 1;
  }
`
